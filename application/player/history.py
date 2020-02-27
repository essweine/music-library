from ..db import Column, insert_statement

from .state import PlaylistTrackData

HISTORY_COLUMNS = [
    Column("filename", "text", None, False),
    Column("start_time", "timestamp", None, False),
    Column("end_time", "timestamp", None, False),
]

class History(object):

    def __init__(self, entry = { }):

        for column in HISTORY_COLUMNS:
            self.__setattr__(column.name, entry.get(column.name, column.default))

    def as_dict(self):
        return self.__dict__.copy()

    @staticmethod
    def create(cursor, playlist_entry):

        statement = insert_statement("history", HISTORY_COLUMNS)
        values = [ playlist_entry.track_data.filename, playlist_entry.start_time, playlist_entry.end_time ]
        try:
            cursor.execute(statement, values)
        except:
            raise

    @classmethod
    def get_playlist_entries(cls, cursor, start, end):

        tt = "create temporary table entries as select filename, end_time from history where start_time > ? and end_time < ?"

        query = """
        select filename, tt.title, tt.rating, id, recording.title, artist, artwork
          from recording 
          join 
          (select recording_id, track.filename, title, rating, end_time
            from track 
            join entries 
            on entries.filename=track.filename
          ) as tt
          on recording.id=tt.recording_id
          order by end_time desc
        """
        fields = [ "filename", "title", "rating", "recording_id", "recording", "artist", "artwork" ]

        try:
            cursor.execute(tt, (start, end))
            cursor.execute(query)
            track_data = [ PlaylistTrackData(**dict(zip(fields, row))) for row in cursor ]
            cursor.execute("drop table entries")
            return track_data
        except:
            raise

