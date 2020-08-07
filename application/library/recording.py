import sqlite3, re
import os.path
from datetime import datetime
from dateutil.parser import parse as parsedate

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
    Column("official", "bool", None, True)
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
        recording = cursor.fetchone()
        if recording is not None:
            recording = dict(recording)
            cursor.execute("select * from track where recording_id=? order by track_num", (recording_id, ))
            recording["tracks"] = [ dict(track) for track in cursor.fetchall() ]
            return cls(recording)
        else:
            return None

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
    def validate(recording):

        # Could add other validation, but not sure how useful that would be.
        validation = [ ]
        try:
            if recording["recording_date"]:
                recording["recording_date"] = parsedate(recording["recording_date"]).strftime("%Y-%m-%d")
        except:
            validation.append(f"Invalid date: {recording['recording_date']}")
        return validation

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
        cursor.execute("select * from recording order by artist, recording_date")

    @classmethod
    def search(cls, cursor, criteria):

        ops = {
            "artist": { "match": "like", "exclude": "not like" },
            "rating": { "match": ">=", "exclude": "<" },
            "sound_rating": { "match": ">=", "exclude": ">" },
            "recording_date": { "match": "=", "exclude": "!=" },
        }

        recording_conditions, recording_values = [ ], [ ]
        match_subqueries, exclude_subqueries = [ ], [ ]
        match_tracks, exclude_tracks = [ ], [ ]
        for cond_type in [ "match", "exclude" ]:
            for item in criteria[cond_type]:
                col, val = item.popitem()
                if col == "track_title":
                    q = "select recording_id from track where title like ?"
                    if cond_type == "match":
                        match_subqueries.append(q)
                        match_tracks.append(val)
                    else:
                        exclude_subqueries.append(q)
                        exclude_tracks.append(val)
                else:
                    recording_conditions.append("{0} {1} ?".format(col, ops[col][cond_type]))
                    recording_values.append(val)

        query = "select * from recording"
        if match_tracks:
            subquery = " intersect ".join(match_subqueries)
            recording_conditions.append(f"id in ({subquery})")
        if exclude_tracks:
            subquery = " intersect ".join(exclude_subqueries)
            recording_conditions.append(f"id not in ({subquery})")
        if recording_conditions:
            query += " where " + " and ".join(recording_conditions)
        query += " order by artist, recording_date"

        cursor.row_factory = cls.row_factory
        cursor.execute(query, recording_values + match_tracks + exclude_tracks)

class Track(JsonSerializable):

    def __init__(self, track = { }):
        for column in TRACK_COLUMNS:
            self.__setattr__(column.name, track.get(column.name, column.default))

