import sqlite3, re
import os.path
from datetime import datetime
from dateutil.parser import parse as parsedate

from ..db import Column, insert_statement, update_statement, convert_empty_strings
from ..util import JsonSerializable

RECORDING_COLUMNS = [
    Column("id", "text", None, False),
    Column("directory", "text", None, False),
    Column("title", "text", None, True),
    Column("artist", "text", None, True),
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
    Column("composer", "text", None, True),
    Column("artist", "text", None, True),
    Column("guest_artist", "text", None, True)
]

class Recording(JsonSerializable):

    def __init__(self, recording = { }):

        convert_empty_strings(recording, RECORDING_COLUMNS)
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
    def set_rating(cursor, rating):

        if rating.rated_item == "rating":
            update = "update recording set rating=? where id=?"
            values = (rating.value, rating.item_id)
        elif rating.rated_item == "sound-rating":
            update = "update recording set sound_rating=? where id=?"
            values = (rating.value, rating.item_id)
        else:
            update = "update track set rating=? where filename=?"
            values = (rating.value, rating.rated_item)

        cursor.execute(update, values)

    @classmethod
    def get_summaries(cls, cursor):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from recording order by artist, recording_date")

    @classmethod
    def search(cls, cursor, criteria):

        ops = {
            "artist": { "match": "like", "exclude": "not like" },
            "genre": { "match": "like", "exclude": "not like" },
            "rating": { "match": ">=", "exclude": "<" },
            "sound_rating": { "match": ">=", "exclude": "<" },
        }

        recording_conditions, recording_values = [ ], [ ]
        match_subqueries, exclude_subqueries = [ ], [ ]
        match_tracks, exclude_tracks = [ ], [ ]
        for cond_type in [ "match", "exclude" ]:

            for item in criteria[cond_type]:

                col, val = item.popitem()

                if col in [ "track_title", "artist", "composer", "guest_artist" ]:
                    name = "title" if col == "track_title" else col
                    q = f"select recording_id from track where {name} like ?"
                    if cond_type == "match":
                        match_subqueries.append(q)
                        match_tracks.append(val)
                    else:
                        exclude_subqueries.append(q)
                        exclude_tracks.append(val)

                if col == "recording_date":
                    date_conditions, date_values = cls._parse_date(val, cond_type == "match")
                    recording_conditions.extend(date_conditions)
                    recording_values.extend(date_values)

                if col in ops:
                    recording_conditions.append("{0} {1} ?".format(col, ops[col][cond_type]))
                    recording_values.append(val)

        if not criteria["official"] and criteria["nonofficial"]:
            recording_conditions.append("official=false")
        elif not criteria["nonofficial"] and criteria["official"]:
            recording_conditions.append("official=true")

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

    @staticmethod
    def _parse_date(val, match):

        try:
            year, month, day = re.split("[-/]", re.sub("\*+", "%", val))
            month = month.zfill(2) if month != "%" else month
            day = day.zfill(0) if day != "%" else day
        except:
            raise Exception(f"Invalid date query: {val}")

        date_conditions, date_values = [ ], [ ]

        if "*" not in val:
            op = "=" if match else "!="
            date_conditions.append(f"recording_date {op} ?")
            date_values.append(f"{year}-{month}-{day}")

        if year != "%":
            if "%" in year:
                op = "like" if match else "not like"
                date_conditions.append(f"strftime('%Y', recording_date) {op} ?")
            else:
                op = "=" if match else "!="
                date_conditions.append(f"strftime('%Y', recording_date) {op} ?")
            date_values.append(year)

        if month != "%":
            op = "=" if match else "!="
            date_conditions.append(f"strftime('%m', recording_date) {op} ?")
            date_values.append(month)

        if day != "%":
            op = "=" if match else "!="
            date_conditions.append(f"strftime('%d', recording_date) {op} ?")
            date_values.append(day)

        return date_conditions, date_values

class Track(JsonSerializable):

    def __init__(self, track = { }):

        convert_empty_strings(track, TRACK_COLUMNS)
        for column in TRACK_COLUMNS:
            self.__setattr__(column.name, track.get(column.name, column.default))

