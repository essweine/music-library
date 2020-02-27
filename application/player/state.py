import json

from ..util import JsonEncoder

class Task(object):

    def __init__(self, name, **kwargs):

        self.name = name
        self.track_data = kwargs.get("track_data", None)
        self.position = kwargs.get("position", None)

    def as_dict(self):

        return self.__dict__.copy()

class PlaylistTrackData(object):

    def __init__(self, filename, title, rating = None, recording_id = None, artist = None, recording = None, artwork = None):

        self.filename = filename
        self.title = title
        self.rating = rating
        self.recording_id = recording_id
        self.artist = artist
        self.recording = recording
        self.artwork = artwork

    def as_dict(self):

        return self.__dict__.copy()

class PlaylistEntry(object):

    def __init__(self, track_data, start_time):

        self.track_data = track_data
        self.start_time = start_time
        self.end_time = None
        self.error = False
        self.error_output = None

    def as_dict(self):

        return self.__dict__.copy()

    def __eq__(self, other):

        if other is None:
            return False
        else:
            return self.track_data.filename == other.track_data.filename and self.start_time == other.start_time

class State(object):

    def __init__(self, stopped, current, last_entry, next_entries, recently_played): 

        self.stopped = stopped
        self.current = current
        self.last_entry = last_entry
        self.next_entries = next_entries
        self.recently_played = recently_played

    def as_dict(self):

        return self.__dict__.copy()

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

    def __repr__(self):

        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])
