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

    def __init__(self, cursor, recording_id):

        try:
            cursor.row_factory = sqlite3.Row
            cursor.execute("select * from recording where id=?", (recording_id, ))
            record = cursor.fetchone()
            # Maybe this is a dumb idea?  I've already forgotten what all the columns are.
            for col, val in zip(record.keys(), record):
                self.__setattr__(col, val)
            cursor.execute("select * from track where recording_id=? order by track_num", (recording_id, ))
            self.tracks = [ Track(**dict(zip(track.keys(), track))) for track in cursor.fetchall() ]
        except:
            raise

    def __repr__(self):

        recording_info = "{artist} - {title} [{id}] [{directory}]".format(
            artist = self.artist,
            title = self.title,
            id = self.id,
            directory = self.directory,
        )

        track_info = "\n".join([ track.__repr__() for track in self.tracks ])
        return "{0}\n{1}".format(recording_info, track_info)

class Track(object):

    def __init__(self, **record):

        for col, val in record.items():
            self.__setattr__(col, val)

    def __repr__(self):

        return "[{num}] {title} [{filename}]".format(
            num = self.track_num,
            title = self.title,
            filename = self.filename,
        )
