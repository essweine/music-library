from datetime import datetime

from ..db import Column, insert_statement
from ..util import JsonSerializable
from ..library import PlaylistTrack

HISTORY_COLUMNS = [
    Column("filename", "text", None, False),
    Column("start_time", "timestamp", None, False),
    Column("end_time", "timestamp", None, False),
]

class History(JsonSerializable):

    def __init__(self, entry = { }):

        for column in HISTORY_COLUMNS:
            self.__setattr__(column.name, entry.get(column.name, column.default))

    @staticmethod
    def create(cursor, playlist_entry):

        statement = insert_statement("history", HISTORY_COLUMNS)
        values = [ playlist_entry.filename, playlist_entry.start_time, playlist_entry.end_time ]
        cursor.execute(statement, values)

    @classmethod
    def from_period(cls, cursor, start, end):

        query = """
          select filename, start_time, end_time
            from history 
            where start_time > ? and end_time < ?
            order by end_time desc
        """

        cursor.execute(query, (start, end))
        return [ cls(dict(zip(cls.ATTRIBUTES, row))) for row in cursor ]

    @classmethod
    def tracks_from_period(cls, cursor, start, end):

        query = """
          select filename, track_sq.title, recording.title, artist, recording.id, track_sq.rating, count, end
            from recording
            join
            (select track.filename, title, recording_id, rating, count, end
              from track
              join
              (select filename, count(*) as count, max(end_time) as end
                from history
                where start_time > ? and end_time < ?
                group by filename) as history_sq
              on track.filename=history_sq.filename) as track_sq
            on track_sq.recording_id=recording.id
            order by end desc
        """

        if isinstance(start, str):
            start = datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%fZ")
        if isinstance(end, str):
            end = datetime.strptime(end, "%Y-%m-%dT%H:%M:%S.%fZ")

        cursor.execute(query, (start, end))
        return [ HistoryTrack(*row) for row in cursor ]

class HistoryTrack(JsonSerializable):

    def __init__(self, filename, title, recording, artist, recording_id, rating, count, end_time):

        self.filename     = filename
        self.title        = title
        self.recording    = recording
        self.artist       = artist
        self.recording_id = recording_id
        self.rating       = rating
        self.count        = count
        self.end_time     = end_time


