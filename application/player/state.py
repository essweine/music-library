import json
from enum import Enum

from ..util import JsonSerializable

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

class State(JsonSerializable):

    def __init__(self, proc_state, current, playlist, history):

        self.proc_state = proc_state
        self.current = current
        self.playlist = playlist
        self.history = history

    def copy(self):

        return State(
            self.proc_state,
            self.current,
            self.playlist.copy(),
            self.history.copy(),
        )

    def __eq__(self, other):

        return all([
            self.proc_state == other.proc_state,
            self.current == other.current,
            self.playlist == other.playlist,
            self.history == other.history,
        ])

