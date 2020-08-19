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

    def __init__(self, filename, start_time):

        self.filename = filename
        self.start_time = start_time
        self.end_time = None
        self.error = False
        self.error_output = None

    def __eq__(self, other):

        if other is None:
            return False
        else:
            return self.filename == other.filename and self.start_time == other.start_time

class State(JsonSerializable):

    def __init__(self, proc_state, current, last_entry, next_entries): 

        self.proc_state = proc_state
        self.current = current
        self.last_entry = last_entry
        self.next_entries = next_entries
        self.elapsed = { }

    def copy(self):

        return State(
            self.proc_state,
            self.current,
            self.last_entry,
            self.next_entries.copy(),
        )

    def __eq__(self, other):

        return all([
            self.proc_state == other.proc_state,
            self.current == other.current,
            self.last_entry == other.last_entry,
            self.next_entries == other.next_entries,
        ])

