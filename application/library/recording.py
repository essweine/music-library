import sqlite3, re
import os.path
from datetime import datetime

from ..db import Column, insert_statement, update_statement
from ..util import JsonSerializable

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

class Recording(JsonSerializable):

    def __init__(self, recording = { }):

        for column in RECORDING_COLUMNS:
            self.__setattr__(column.name, recording.get(column.name, column.default))
        self.tracks = [ Track(track) for track in recording.get("tracks", [ ]) ]

    def as_dict(self):

        recording = self.__dict__.copy()
        recording["tracks"] = [ track.as_dict() for track in recording["tracks"] ]
        return recording

    @classmethod
    def get(cls, cursor, recording_id):

        cursor.row_factory = sqlite3.Row
        cursor.execute("select * from recording where id=?", (recording_id, ))
        recording = dict(cursor.fetchone())
        cursor.execute("select * from track where recording_id=? order by track_num", (recording_id, ))
        recording["tracks"] = [ dict(track) for track in cursor.fetchall() ]
        return cls(recording)

    @staticmethod
    def create(cursor, recording):

        insert_recording = insert_statement("recording", RECORDING_COLUMNS)
        insert_track = insert_statement("track", TRACK_COLUMNS)

        recording["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        recording_values = [ recording.get(col.name, col.default) for col in RECORDING_COLUMNS ]

        for track in recording.get("tracks", [ ]):
            track["recording_id"] = recording["id"]
        get_track = lambda track: [ track.get(col.name, col.default) for col in TRACK_COLUMNS ]
        tracks_values = [ get_track(track) for track in recording.get("tracks", [ ]) ]

        cursor.execute(insert_recording, recording_values)
        cursor.executemany(insert_track, tracks_values)

    @staticmethod
    def update(cursor, recording):

        recording_vals = [ recording.get(col.name) for col in RECORDING_COLUMNS if col.updateable ] + [ recording.get("id") ]
        update_recording = update_statement("recording", "id", RECORDING_COLUMNS)

        get_track = lambda track: [ track.get(col.name) for col in TRACK_COLUMNS if col.updateable ] + [ track.get("filename") ]
        track_vals = [ get_track(track) for track in recording.get("tracks", [ ]) ]
        update_track = update_statement("track", "filename", TRACK_COLUMNS)

        cursor.execute(update_recording, recording_vals)
        cursor.executemany(update_track, track_vals)

    @staticmethod
    def set_rating(cursor, recording_id, data):

        item = data.get("item")
        rating = data.get("rating")

        if item == "rating":
            update = "update recording set rating=? where id=?"
            values = (rating, recording_id)
        elif item == "sound-rating":
            update = "update recording set sound_rating=? where id=?"
            values = (rating, recording_id)
        else:
            update = "update track set rating=? where filename=?"
            values = (rating, item)

        cursor.execute(update, values)

    @classmethod
    def get_summaries(cls, cursor):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from recording")

    @classmethod
    def search(cls, cursor, criteria):

        columns = [ "artist", "rating", "sound_rating" ]
        values = [ criteria[val] for val in columns if val in criteria ]
        recording_conditions = [ "{0}=?".format(col) for col in columns if col in criteria ] 
        query = "select * from recording"
        if recording_conditions:
            query += " where " + " and ".join(recording_conditions)

        cursor.row_factory = cls.row_factory
        cursor.execute(query, values)

class Track(JsonSerializable):

    def __init__(self, track = { }):
        for column in TRACK_COLUMNS:
            self.__setattr__(column.name, track.get(column.name, column.default))

