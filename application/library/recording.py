import sqlite3
import json
import os.path
from datetime import datetime

from ..db import Column, insert_statement, update_statement

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
    Column("rating", "int", None, True),
]

class Recording(object):

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
        if recording["recording_date"] is not None:
            recording["recording_date"] = recording["recording_date"].strftime("%Y-%m-%d")
        if recording["added_date"] is not None:
            recording["added_date"] = recording["added_date"].strftime("%Y-%m-%d")
        return recording

    def as_json(self):

        return json.dumps(self.as_dict())

    def __repr__(self):

        return json.dumps(self.as_dict(), indent = 2, separators = [ ", ", ": " ])

    @staticmethod
    def create_recording(cursor, **recording):

        insert_recording = insert_statement("recording", RECORDING_COLUMNS)
        insert_track = insert_statement("track", TRACK_COLUMNS)

        recording["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        recording_values = [ recording.get(col.name, col.default) for col in RECORDING_COLUMNS ]

        for track in recording.get("tracks", [ ]):
            track["recording_id"] = recording["id"]
        get_track = lambda track: [ track.get(col.name, col.default) for col in TRACK_COLUMNS ]
        tracks_values = [ get_track(track) for track in recording.get("tracks", [ ]) ]

        try:
            cursor.execute(insert_recording, recording_values)
            cursor.executemany(insert_track, tracks_values)
        except Exception as exc:
            raise

    @staticmethod
    def update_recording(cursor, **recording):

        recording_vals = [ recording.get(col.name) for col in RECORDING_COLUMNS if col.updateable ] + [ recording.get("id") ]
        update_recording = update_statement("recording", "id", RECORDING_COLUMNS)

        get_track = lambda track: [ track.get(col.name) for col in TRACK_COLUMNS if col.updateable ] + [ track.get("filename") ]
        track_vals = [ get_track(track) for track in recording.get("tracks", [ ]) ]
        update_track = update_statement("track", "filename", TRACK_COLUMNS)

        try:
            cursor.execute(update_recording, recording_vals)
            cursor.executemany(update_track, track_vals)
        except:
            raise

    @staticmethod
    def update_rating(cursor, recording_id, data):

        item = data.get("item")
        rating = data.get("rating")

        if item == "recording":
            update = "update recording set rating=? where id=?"
            values = (rating, recording_id)
        elif item == "sound_rating":
            update = "update recording set sound_rating=? where id=?"
            values = (rating, recording_id)
        else:
            update = "update track set rating=? where filename=?"
            values = (rating, item)

        try:
            cursor.execute(update, values)
        except:
            raise

    @staticmethod
    def new():

        obj = dict([ (column.name, column.default) for column in RECORDING_COLUMNS ])
        obj["tracks"] = [ ]
        return obj

class Track(object):

    def __init__(self, track):

        for column in TRACK_COLUMNS:
            self.__setattr__(column.name, track[column.name])

    def as_json(self):

        return json.dumps(self.__dict__)

    def __repr__(self):

        return json.dumps(self.__dict__, indent = 2, separators = [ ", ", ": " ])

    @staticmethod
    def new():
        return dict([ (column.name, column.default) for column in TRACK_COLUMNS ])

