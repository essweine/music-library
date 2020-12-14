from enum import Enum

from ..util import BaseObject
from .playlist import PlaylistState

class ProcState(Enum):

    Playing = "playing"
    Stopped = "stopped"
    Paused  = "paused"

class Task(BaseObject):

    ATTRIBUTES = [ "name", "filename", "position", "original", "destination", "offset", "url", "filenames", "directory" ]

    def __init__(self, **task):

        for attr in filter(lambda a: a in task, self.ATTRIBUTES):
            self.__setattr__(attr, task.get(attr))

class State(BaseObject):

    def __init__(self, **state):

        self.proc_state = state.get("proc_state", ProcState.Stopped)
        self.current = state.get("current", 0)
        self.playlist = state.get("playlist", [ ])
        self.history = state.get("history", [ ])
        self.stream = state.get("stream")
        self.shuffle = state.get("shuffle", False)
        self.repeat = state.get("repeat", False)
        self.preview = state.get("preview", None)

        self._playlist_state = PlaylistState()

