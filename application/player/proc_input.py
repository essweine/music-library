import tempfile, os
import re

import requests
from requests.exceptions import ConnectionError, Timeout

from ..util import BaseObject

class ProcInput(BaseObject):

    def __init__(self, filename, **data):

        self.filename = filename
        self.title = data.get("title")
        self.start_time = data.get("start_time")
        self.end_time = data.get("end_time")
        self.last_updated = data.get("last_updated")
        self.elapsed = data.get("elapsed", 0)
        self.info = data.get("info", { })
        self.error = data.get("error")

class FileInput(ProcInput):

    def __init__(self, filename, **data):

        super().__init__(filename, **data)
        self.duration = data.get("duration", 0)

class StreamInput(ProcInput):

    def __init__(self, url, **data):

        super().__init__(**data)
        self.url = url
        self.metadata = data.get("metadata", { })
        self.status = data.get("status", { })

        self._response = None
        self._has_metadata = None
        self._chunk_size = 16000

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

        self._chunk_size = 1000000
        self._response = None
        self._file = None
        self._finished = False

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
            self._finished = True

    def remove(self):

        if not self._finished:
            self._response.close()
            self._file.close()
        os.remove(self.filename)
