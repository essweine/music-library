from enum import Enum

from ..util import JsonSerializable
from .playlist import PlaylistState

class ProcState(Enum):

    Playing = "playing"
    Stopped = "stopped"
    Paused  = "paused"

class Task(JsonSerializable):

    ATTRIBUTES = [ "filename", "position", "original", "destination", "offset", "url" ]

    def __init__(self, name, **kwargs):

        self.name = name
        for attr in self.ATTRIBUTES:
            if attr in kwargs:
                self.__setattr__(attr, kwargs[attr])

class State(JsonSerializable):

    def __init__(self, proc_state, current, playlist, history, stream, shuffle, repeat):

        self.proc_state = proc_state
        self.current = current
        self.playlist = playlist
        self.history = history
        self.stream = stream
        self.shuffle = shuffle
        self.repeat = repeat

        self._playlist_state = PlaylistState(0, [ ], False, False)

