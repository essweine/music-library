import json

class State(object):

    def __init__(self, stopped, current_track, recently_played, next_tracks, last_output, last_error): 

        self.stopped = stopped
        self.current_track = current_track
        self.recently_played = recently_played
        self.next_tracks = next_tracks
        self.last_output = None
        self.last_error = None

    def copy(self):

        return State(
            self.stopped,
            self.current_track,
            self.recently_played,
            self.next_tracks,
            self.last_output,
            self.last_error
        )

    def __eq__(self, other):

        return all([
            self.stopped == other.stopped,
            self.current_track == other.current_track,
            self.recently_played == other.recently_played,
            self.next_tracks == other.next_tracks,
        ])

    def __repr__(self):

        stopped = "stopped" if self.stopped else "playing"
        current = " " + self.current_track.title if self.current_track else ""
        most_recent = ": " + self.recently_played[0].title if self.recently_played else ""
        earlier = " + " + str(len(self.recently_played) - 1) if len(self.recently_played) > 1 else ""
        up_next = ": " + self.next_tracks[0].title if self.next_tracks else ""
        later = " + " + str(len(self.next_tracks) - 1) if len(self.next_tracks) > 1 else ""
        playing = "{stopped}{current}, recently played{most_recent}{earlier}, next{up_next}{later}".format(
            stopped = stopped,
            current = current,
            most_recent = most_recent,
            earlier = earlier,
            up_next = up_next,
            later = later
        )
        last_output = "last output: {0}".format(self.last_output if self.last_output is not None else "")
        last_error = "last error: {0}".format(self.last_error if self.last_error is not None else "")
        return "\n".join([ playing, last_output, last_error ])
