from enum import Enum

from ..util import BaseObject
from .playlist import Playlist

class Task(BaseObject):

    ATTRIBUTES = {
        "add": [ "filename", "position", "info" ],
        "remove": [ "position" ],
        "move": [ "original", "destination" ],
        "skip": [ "offset" ],
        "stream": [ "url", "info" ],
        "podcast": [ "url", "info" ],
        "preview": [ "filenames", "directory" ],
        "seek": [ "time" ],
    }

    def __init__(self, **task):

        self.__setattr__("name", task.get("name"))
        for attr in self.ATTRIBUTES.get(self.name, [ ]):
            self.__setattr__(attr, task.get(attr))

class ProcState(Enum):

    Playing = "playing"
    Stopped = "stopped"
    Paused  = "paused"

class ProcData(BaseObject):

    def __init__(self, **data):

        self.entry_id = data.get("entry_id")
        self.entry_type = data.get("entry_type")
        self.title = data.get("title")
        self.duration = data.get("duration")
        self.start_time = data.get("start_time")
        self.end_time = data.get("end_time")
        self.last_updated = data.get("last_updated")
        self.elapsed = data.get("elapsed", 0)
        self.error = data.get("error")

class State(BaseObject):

    def __init__(self, **state):

        self.proc_state = state.get("proc_state", ProcState.Stopped)
        self.current = state.get("current", None)
        self.previous = state.get("previous", None)
        self.stream = state.get("stream")
        self.podcast = state.get("podcast")
        self.playlist = state.get("playlist", Playlist())

