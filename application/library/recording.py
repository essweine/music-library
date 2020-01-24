import sqlite3
import json
from datetime import datetime

RECORDING_COLUMNS = [
    ("id", "text", None),
    ("directory", "text", None),
    ("title", "text", None),
    ("artist", "text", None),
    ("composer", "text", None),
    ("genre", "text", None),
    ("notes", "text", None),
    ("artwork", "text", None),
    ("recording_date", "date", None),
    ("venue", "text", None),
    ("added_date", "date", None),
    ("rating", "int", None),
    ("sound_rating", "int", None),
]

TRACK_COLUMNS = [
    ("recording_id", "text", None),
    ("track_num", "int", None),
    ("title", "text", None),
    ("filename", "text", None),
    ("listen_count", "int", 0),
    ("rating", "int", None),
]

class Recording(object):

    def __init__(self, cursor, recording_id):

        try:
            cursor.row_factory = sqlite3.Row
            cursor.execute("select * from recording where id=?", (recording_id, ))
            recording = cursor.fetchone()

            for col, col_type, default in RECORDING_COLUMNS:
                self.__setattr__(col, recording[col])

            cursor.execute("select * from track where recording_id=? order by track_num", (recording_id, ))
            self.tracks = [ Track(track) for track in cursor.fetchall() ]
        except:
            raise

    def as_json(self):

        recording = self.__dict__.copy()
        recording["tracks"] = [ track.__dict__.copy() for track in recording["tracks"] ]
        recording["recording_date"] = recording["recording_date"].strftime("%Y-%m-%d")
        recording["added_date"] = recording["added_date"].strftime("%Y-%m-%d")
        return json.dumps(recording)

    def __repr__(self):

        recording_info = "{artist} - {title} [{id} / {directory}]".format(
            artist = self.artist,
            title = self.title,
            id = self.id,
            directory = self.directory,
        )

        track_info = "\n".join([ track.__repr__() for track in self.tracks ])
        return "{0}\n{1}".format(recording_info, track_info)

class Track(object):

    def __init__(self, track):

        for col, col_type, default in TRACK_COLUMNS:
            self.__setattr__(col, track[col])

    def as_json(self):

        return json.dumps(self.__dict__)

    def __repr__(self):

        return "[{num} / {recording}] {title} [{filename}]".format(
            num = self.track_num,
            recording = self.recording_id,
            title = self.title,
            filename = self.filename,
        )
