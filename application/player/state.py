from enum import Enum

from ..util import BaseObject
from .playlist import Playlist

class Task(BaseObject):

    ATTRIBUTES = {
        "add": [ "filenames", "position" ],
        "remove": [ "position" ],
        "move": [ "original", "destination" ],
        "skip": [ "offset" ],
        "stream": [ "url" ],
        "podcast": [ "url" ],
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
    Error   = "error"

class PlayerMode(Enum):

    Playlist = "playlist"
    Download = "download"
    Stream   = "stream"

class State(BaseObject):

    def __init__(self, **state):

        self.proc_state = state.get("proc_state", ProcState.Stopped)
        self.mode = state.get("mode", PlayerMode.Playlist)
        self.current = state.get("current", None)
        self.playlist = state.get("playlist", Playlist())
        self._previous = None

