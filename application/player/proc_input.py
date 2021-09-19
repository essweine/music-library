import tempfile, os
import re

import requests
from requests.exceptions import ConnectionError, Timeout

from ..util import BaseObject
from ..library import StationTable, PodcastEpisodeTable, PodcastSearchView, PlaylistTrackView, HistoryTable

class ProcInput(BaseObject):

    def __init__(self, filename, **data):

        self.filename = filename
        self.title = data.get("title")
        self.start_time = data.get("start_time")
        self.end_time = data.get("end_time")
        self.last_updated = data.get("last_updated")
        self.elapsed = data.get("elapsed", 0)
        self.error = data.get("error")

class FileInput(ProcInput):

    def __init__(self, filename, track_id, **data):

        super().__init__(filename, **data)
        self.track_id = track_id
        self.duration = data.get("duration", 0)

    def set_info(self, cursor):
        
        if self.track_id is not None:
            self.info = PlaylistTrackView.get(cursor, self.track_id)
            self.title = self.info.title + "[" + " / ".join(self.info.artist) + "]"
        else:
            self.info = PlaylistTrackView.create_item(filename = self.filename, title = self.filename)
            self.title = self.filename

    def update_history(self, cursor):
        HistoryTable.update_history(cursor, self)

class StreamInput(ProcInput):

    def __init__(self, url, **data):

        super().__init__(**data)
        self.url = url
        self.metadata = data.get("metadata", { })
        self.status = data.get("status", { })

        self._response = None
        self._has_metadata = None
        self._chunk_size = 16000

    def set_info(self, cursor):
        self.info = StationTable.from_url(cursor, self.url)
        self.title = self.info.name

    def update_history(self, cursor):
        StationTable.update_history(cursor, self)

    def connect(self):

        try:
            headers = { "icy-metadata": "1" }
            resp = requests.get(self.url, headers = headers, stream = True)
            self.status["status_code"] = resp.status_code
            self.status["reason"] = resp.reason
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

        self._response.close()

class DownloadInput(ProcInput):

    def __init__(self, url, **data):

        super().__init__(**data)
        self.url = url
        self.status = data.get("status", { })
        self.duration = data.get("duration", 0)
        self.download_finished = data.get("download_finished", False)

        self._chunk_size = 1000000
        self._response = None
        self._file = None

    def set_info(self, cursor):
        self.info = PodcastSearchView.from_url(cursor, self.url)
        self.title = self.info.podcast_name

    def update_history(self, cursor):
        PodcastEpisodeTable.update_history(cursor, self)

    def download(self):

        try:
            resp = requests.get(self.url, stream = True)
            self.status["status_code"] = resp.status_code
            self.status["reason"] = resp.reason
            resp.raise_for_status()
            self._response = resp
        except (ConnectionError, Timeout) as exc:
            self.status["reason"] = str(exc)
            raise

        try:
            filename = re.sub("\?.*", "", self.url.split("/")[-1])
            self.filename = os.path.join(tempfile.gettempdir(), filename)
            self._file = open(self.filename, "wb")
        except:
            self._response.close()
            raise

    def read(self):

        data = self._response.raw.read(self._chunk_size)
        if len(data) > 0:
            self._file.write(data)
        else:
            self._file.close()
            self.download_finished = True

    def remove(self):

        if not self.download_finished:
            self._response.close()
            self._file.close()
        os.remove(self.filename)
