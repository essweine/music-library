import json

from .playlist_track import PlaylistTrack
from ..util import JsonSerializable

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

    def add_track_info(self, cursor):

        return {
            "current": PlaylistTrack.from_filename(cursor, self.current.filename) if self.current else None,
            "next_entries": PlaylistTrack.from_filenames(cursor, [ e.filename for e in self.next_entries ]),
            "recently_played": PlaylistTrack.from_filenames(cursor, [ e.filename for e in self.recently_played ]),
        }

    def __eq__(self, other):

        return all([
            self.stopped == other.stopped,
            self.current == other.current,
            self.last_entry == other.last_entry,
            self.next_entries == other.next_entries,
        ])

