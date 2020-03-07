import re

from ..util import JsonEncoder

class PlaylistTrack(object):

    ATTRIBUTES = [ "filename", "title", "rating", "recording_id", "artist", "recording", "artwork" ]

    def __init__(self, data):

        for attr in self.ATTRIBUTES:
            self.__setattr__(attr, data.pop(attr, None))

        if self.filename is None:
            raise Execption("Invalid track data")

    def as_dict(self):
        return self.__dict__.copy()

    def __repr__(self):
        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])

    @classmethod
    def from_filename(cls, cursor, filename):

        result = cls.from_filenames(cursor, [ filename ])
        return result[0] if result else None

    @classmethod
    def from_filenames(cls, cursor, filenames):

        escaped_names = ", ".join([ "'{0}'".format(re.sub("'", "''", fn)) for fn in filenames ])

        query = """
        select filename, sq.title, sq.rating, recording_id, artist, recording.title, artwork
        from recording
        join
        (select filename, recording_id, title, rating
          from track 
          where filename in ({0})
        ) as sq
        on recording.id=sq.recording_id
        """.format(escaped_names)

        try:
            cursor.execute(query)
            return [ cls(dict(zip(cls.ATTRIBUTES, row))) for row in cursor ]
        except:
            raise


