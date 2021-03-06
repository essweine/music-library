import json
from enum import Enum
from datetime import datetime
from random import shuffle, choice

import requests
from requests.exceptions import ConnectionError, Timeout

from ..util import BaseObject

class PlaylistState(BaseObject):

    def __init__(self, **state):

        self.position = state.get("position", 0)
        self.order = state.get("order", [ ])
        self.shuffled = state.get("shuffled", False)
        self.repeat = state.get("repeat", False)
        self.preview = state.get("preview", None)

    @property
    def current(self):
        return self.order[self.position] if len(self.order) else 0

    @property
    def at_end(self):
        return self.position == len(self.order)

    def advance(self):

        self.position = self.position + 1
        if self.repeat and self.at_end:
            self.position = 0

    def clear(self):

        self.position = 0
        self.order = [ ]

    def shuffle(self, current):

        if len(self.order):
            self.position = self.order.index(current)
        shuffle(self.order)
        self.shuffled = True

    def unshuffle(self, current):

        self.order = list(range(len(self.order)))
        self.position = current
        self.shuffled = False

    def move(self, destination):

        if self.shuffled:
            original = self.order[self.position]
            idx = self.order.index(destination)
            self.order[idx] = original
            self.order[self.position] = destination
        else:
            self.position = destination

    def add(self, position):

        if self.shuffled:
            self.order = list(map(lambda v: v + 1 if v >= position else v, self.order))
            idx = choice(list(range(self.position, len(self.order) + 1)))
            self.order.insert(idx, position)
        else:
            if position <= self.position and len(self.order) > 0:
                self.position = self.position + 1
            self.order.append(len(self.order))

    def remove(self, position):

        if self.position > 0 and position < self.position:
            self.position = self.position - 1
        self.order.remove(position)
        self.order = list(map(lambda v: v - 1 if v > position else v, self.order))

    def skip(self, offset):

        position = self.position + offset
        if position >= 0 and position < len(self.order):
            self.position = position
        elif position < 0 and self.repeat:
            self.position = len(self.order) - 1
        elif position >= len(self.order) and self.repeat:
            self.position = 0

class PlaylistEntry(BaseObject):

    def __init__(self, filename, **entry):

        self.filename = filename
        self.start_time = entry.get("start_time")
        self.end_time = entry.get("end_time")
        self.error = entry.get("error", False)
        self.error_output = entry.get("error_output")

class StreamEntry(BaseObject):

    def __init__(self, url, **entry):

        self.url = url
        self.metadata = entry.get("metadata", { })
        self.status = entry.get("status", { })
        self.start_time = entry.get("start_time")
        self.end_time = entry.get("end_time")

        self._response = None
        self._has_metadata = None
        self._chunk_size = 16000

    def connect(self):

        try:
            headers = { "icy-metadata": "1" }
            resp = requests.get(self.url, headers = headers, stream = True)
            self.status["status_code"] = resp.status_code
            self.status["reason"] = resp.reason
            self.start_time = datetime.utcnow()
            resp.raise_for_status()
            self._response = resp
            if "icy-metaint" in resp.headers:
                self._has_metadata = True
                self._chunk_size = int(resp.headers["icy-metaint"])
        except(ConnectionError, Timeout) as exc:
            self.status["reason"] = str(exc)
            raise

    def read(self):

        audio = self._response.raw.read(self._chunk_size)
        if self._has_metadata:
            meta_size = int(self._response.raw.read(1).hex(), base = 16) * 16
            if meta_size > 0:
                metadata = self._response.raw.read(meta_size).decode("utf-8").strip("\x00").strip()
                items = [ item.split("=") for item in metadata.split(";") if len(item) > 1 ]
                cleaned = [ [ token.strip("'") for token in item ]  for item in items ]
                self.metadata = dict(([ (item[0], "=".join(item[1:])) for item in cleaned ]))
        return audio

    def close(self):

        self.end_time = datetime.utcnow()
        self._response.close()
