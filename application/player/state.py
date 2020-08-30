import json
from enum import Enum
import time

import requests
from requests.exceptions import ConnectionError, Timeout

from ..util import JsonSerializable
from ..library import PlaylistTrack

class ProcState(Enum):
    Playing = "playing"
    Stopped = "stopped"
    Paused  = "paused"

class Task(JsonSerializable):

    def __init__(self, name, filename = None, position = None):

        self.name = name
        self.filename = filename
        self.position = position

class PlaylistEntry(JsonSerializable):

    def __init__(self, filename):

        self.filename = filename
        self.start_time = None
        self.end_time = None
        self.error = False
        self.error_output = None

    def __eq__(self, other):

        if other is None:
            return False
        else:
            return self.filename == other.filename and self.start_time == other.start_time

class StreamEntry(JsonSerializable):

    def __init__(self, url):

        self.url = url
        self.response = None
        self.has_metadata = None
        self.metadata = None
        self.status = { "status_code": None, "reason": None }
        self.chunk_size = 16000

    def connect(self, attempt = 0):

        try:
            headers = { "icy-metadata": "1" }
            resp = requests.get(self.url, headers = headers, stream = True)
            self.status["status_code"] = resp.status_code
            self.status["reason"] = resp.reason
            resp.raise_for_status()
            self.response = resp
            if "icy-metaint" in resp.headers:
                self.has_metadata = True
                self.chunk_size = int(resp.headers["icy-metaint"])
        except(ConnectionError, Timeout) as exc:
            self.status["reason"] = str(exc)
            raise

    def read(self):

        audio = self.response.raw.read(self.chunk_size)
        if self.has_metadata:
            meta_size = int(self.response.raw.read(1).hex(), base = 16) * 16
            if meta_size > 0:
                metadata = self.response.raw.read(meta_size).decode("utf-8").strip("\x00").strip()
                items = [ item.split("=") for item in metadata.split(";") if len(item) > 1 ]
                cleaned = [ [ token.strip("'") for token in item ]  for item in items ]
                self.metadata = dict(([ (item[0], "=".join(item[1:])) for item in cleaned ]))
        return audio

    def close(self):

        self.response.close()

    def copy(self):

        stream = StreamEntry(self.url)
        stream.has_metadata = self.has_metadata
        stream.metadata = self.metadata
        stream.status = self.status
        stream.chunk_size = self.chunk_size
        return stream

    def __eq__(self, other):

        if other is None:
            return False
        else:
            return self.url == other.url and self.metadata == other.metadata and self.status == other.status

class State(JsonSerializable):

    def __init__(self, proc_state, current, playlist, history, stream):

        self.proc_state = proc_state
        self.current = current
        self.playlist = playlist
        self.history = history
        self.stream = stream

    def copy(self):

        return State(
            self.proc_state,
            self.current,
            self.playlist.copy(),
            self.history.copy(),
            self.stream.copy() if self.stream is not None else None,
        )

    def __eq__(self, other):

        return all([
            self.proc_state == other.proc_state,
            self.current == other.current,
            self.playlist == other.playlist,
            self.history == other.history,
            self.stream == other.stream
        ])

