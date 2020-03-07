import json

from ..util import JsonEncoder

class Task(object):

    def __init__(self, name, filename = None, position = None):

        self.name = name
        self.filename = filename
        self.position = position

    def as_dict(self):
        return self.__dict__.copy()

    def __repr__(self):
        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])

class PlaylistEntry(object):

    def __init__(self, filename, start_time):

        self.filename = filename
        self.start_time = start_time
        self.end_time = None
        self.error = False
        self.error_output = None

    def as_dict(self):
        return self.__dict__.copy()

    def __repr__(self):
        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])

    def __eq__(self, other):

        if other is None:
            return False
        else:
            return self.filename == other.filename and self.start_time == other.start_time

class State(object):

    def __init__(self, stopped, current, last_entry, next_entries, recently_played): 

        self.stopped = stopped
        self.current = current
        self.last_entry = last_entry
        self.next_entries = next_entries
        self.recently_played = recently_played

    def copy(self):

        return State(
            self.stopped,
            self.current,
            self.last_entry,
            self.next_entries.copy(),
            self.recently_played.copy()
        )

    def __eq__(self, other):

        return all([
            self.stopped == other.stopped,
            self.current == other.current,
            self.last_entry == other.last_entry,
            self.next_entries == other.next_entries,
        ])

    def as_dict(self):
        return self.__dict__.copy()

    def __repr__(self):
        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])
