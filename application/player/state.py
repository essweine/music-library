import json

class HistoryEntry(object):

    def __init__(self, track, start_time):

        self.track = track
        self.start_time = start_time
        self.end_time = None
        self.error = False
        self.error_output = None

    def get_values(self):

        return { 
            "filename": self.track.filename, 
            "start_time": self.start_time,
            "end_time": self.end_time,
        }

    def __eq__(self, other):

        if other is None:
            return False
        else:
            return self.track.filename == other.track.filename and self.start_time == other.start_time

class State(object):

    def __init__(self, stopped, current, last_entry, next_tracks): 

        self.stopped = stopped
        self.current = current
        self.last_entry = last_entry
        self.next_tracks = next_tracks

    def copy(self):

        return State(
            self.stopped,
            self.current,
            self.last_entry,
            self.next_tracks,
        )

    def __eq__(self, other):

        return all([
            self.stopped == other.stopped,
            self.current == other.current,
            self.last_entry == other.last_entry,
            self.next_tracks == other.next_tracks,
        ])

    def __repr__(self):

        stopped = "stopped" if self.stopped else "playing"
        current = " " + self.current.track.title if self.current is not None else ""
        up_next = ": " + self.next_tracks[0].title if self.next_tracks else ""
        later = " + " + str(len(self.next_tracks) - 1) if len(self.next_tracks) > 1 else ""
        return "{stopped}{current}, next{up_next}{later}".format(
            stopped = stopped,
            current = current,
            up_next = up_next,
            later = later
        )
