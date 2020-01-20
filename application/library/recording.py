import sqlite3
from datetime import datetime

class Recording(object):

    @classmethod
    def create(cls, cursor, **record):

        columns = [ "id", "directory", "title", "artist", "notes", "artwork", "recording_date", "venue", "added_date" ]
        values = dict([ (col, record.get(col, None)) for col in columns ])
        values["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        if values["id"] is None or values["directory"] is None:
            raise Exception("Directory and recording id are required")

        tracks = record.get("tracklist", [ ])

        insert_stmt = "insert into recording ({columns}) values ({placeholders})".format(
            columns = ", ".join(columns),
            placeholders = ", ".join([ "?" for col in columns ])
        )

        try:
            cursor.execute(insert_stmt, [ values[col] for col in columns ])
            for track in tracks:
                cls.create_track(cursor, recording_id = values["id"], **track)
        except Exception as exc:
            raise

    @classmethod
    def create_track(cls, cursor, **track):

        columns = [ "recording_id", "track_num", "title", "filename" ]
        values = dict([ (col, track.get(col, None)) for col in columns ])
        if values["filename"] is None:
            raise Exception("Filename is required")

        insert_stmt = "insert into track ({columns}) values ({placeholders})".format(
            columns = ", ".join(columns),
            placeholders = ", ".join([ "?" for col in columns ])
        )

        try:
            cursor.execute(insert_stmt, [ values[col] for col in columns ])
        except Exception as exc:
            raise

    def __init__(self, recording_id):

        pass


class Track(object):

    def __init__(self, **record):

        self.recording_id = record.get("recording_id", None)
        self.position = record.get("position", None)
        self.title = record.get("title", None)
        self.filename = record.get("filename", None)
        self.rating = record.get("rating", None)
        self.listen_count = record.get("listen_count", 0)

