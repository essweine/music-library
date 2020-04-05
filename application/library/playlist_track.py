import re

from ..util import JsonSerializable
from .recording import RECORDING_COLUMNS, TRACK_COLUMNS

class PlaylistTrack(JsonSerializable):

    ATTRIBUTES = [ "filename", "title", "rating", "recording_id", "artist", "recording", "artwork" ]

    def __init__(self, data):

        for attr in self.ATTRIBUTES:
            self.__setattr__(attr, data.pop(attr, None))

        if self.filename is None:
            raise Execption("Invalid track data")

    @classmethod
    def from_filename(cls, cursor, filename):

        cls.from_filenames(cursor, [ filename ])

    @classmethod
    def from_filenames(cls, cursor, filenames):

        escaped_names = ", ".join([ cls._escape(fn) for fn in filenames ])

        query = """
        select filename, sq.title as title, sq.rating, recording_id, artist, recording.title as recording, artwork
        from recording
        join
        (select filename, recording_id, title, rating
          from track 
          where filename in ({0})
        ) as sq
        on recording.id=sq.recording_id
        """.format(escaped_names)

        cursor.row_factory = cls.row_factory
        cursor.execute(query)

    @staticmethod
    def _escape(value):
        return "'{0}'".format(re.sub("'", "''", value))

    @classmethod
    def search(cls, cursor, criteria):

        track = [ "{0}=?".format(col) for col in [ "title", "rating" ] if col in criteria ]
        recording = [ "{0}=?".format(col) for col in [ "recording", "artist" ] if col in criteria ]
        values = [ criteria.get(val) for val in [ "title", "rating", "recording", "artist" ] if val in criteria ]

        t1 = "(select filename, title, rating, recording_id from track where {0})".format(" and ".join(track)) if track else "track"
        t2 = "(select id, title, artist, artwork from recording where {0})".format(" and ".join(recording)) if recording else "recording"

        query = """
        select filename, t1.title, t1.rating, recording_id, artist, t2.title as recording, artwork
        from {0} as t1
        join {1} as t2
        on t2.id=recording_id
        """.format(t1, t2)

        cursor.row_factory = cls.row_factory
        if values:
            cursor.execute(query, values)
        else:
            cursor.execute(query)

    @staticmethod
    def create_clause(criterion):

        op = criterion.get("operator", "=")
        if op not in [ "=", "!=", "<", ">", "<=", ">=" ]:
            raise Exception("Unsupported operator")

        
