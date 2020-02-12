import sqlite3
import json
import os.path
from datetime import datetime
from collections import namedtuple

Column = namedtuple('Column', [ 'name', 'type', 'default', 'updateable' ])

RECORDING_COLUMNS = [
    Column("id", "text", None, False),
    Column("directory", "text", None, False),
    Column("title", "text", None, True),
    Column("artist", "text", None, True),
    Column("composer", "text", None, True),
    Column("genre", "text", None, True),
    Column("notes", "text", None, True),
    Column("artwork", "text", None, True),
    Column("recording_date", "date", None, True),
    Column("venue", "text", None, True),
    Column("added_date", "date", None, False),
    Column("rating", "int", None, True),
    Column("sound_rating", "int", None, True),
]

TRACK_COLUMNS = [
    Column("recording_id", "text", None, False),
    Column("track_num", "int", None, True),
    Column("title", "text", None, True),
    Column("filename", "text", None, False),
    Column("listen_count", "int", 0, True),
    Column("rating", "int", None, True),
]

class Recording(object):

    @staticmethod
    def new():
        obj = dict([ (column.name, column.default) for column in RECORDING_COLUMNS ])
        obj["tracks"] = [ ]
        return obj

    def __init__(self, cursor, recording_id):

        try:
            cursor.row_factory = sqlite3.Row
            cursor.execute("select * from recording where id=?", (recording_id, ))
            recording = cursor.fetchone()

            for column in RECORDING_COLUMNS:
                self.__setattr__(column.name, recording[column.name])

            cursor.execute("select * from track where recording_id=? order by track_num", (recording_id, ))
            self.tracks = [ Track(track) for track in cursor.fetchall() ]
        except:
            raise

    def as_dict(self):

        recording = self.__dict__.copy()
        recording["tracks"] = [ track.__dict__.copy() for track in recording["tracks"] ]
        recording["recording_date"] = recording["recording_date"].strftime("%Y-%m-%d")
        recording["added_date"] = recording["added_date"].strftime("%Y-%m-%d")
        return recording

    def as_json(self):

        return json.dumps(self.as_dict())

    def __repr__(self):

        return json.dumps(self.as_dict(), indent = 2, separators = [ ", ", ": " ])

class Track(object):

    @staticmethod
    def new():
        return dict([ (column.name, column.default) for column in TRACK_COLUMNS ])

    def __init__(self, track):

        for column in TRACK_COLUMNS:
            self.__setattr__(column.name, track[column.name])

    def as_json(self):

        return json.dumps(self.__dict__)

    def __repr__(self):

        return json.dumps(self.__dict__, indent = 2, separators = [ ", ", ": " ])
