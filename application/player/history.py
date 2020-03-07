from ..db import Column, insert_statement

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
        values = [ playlist_entry.filename, playlist_entry.start_time, playlist_entry.end_time ]
        try:
            cursor.execute(statement, values)
        except:
            raise

    @classmethod
    def from_period(cls, cursor, start, end):

        query = """
          select filename, start_time, end_time
            from history 
            where start_time > ? and end_time < ?
            order by end_time desc
        """

        try:
            cursor.execute(tt, (start, end))
            cursor.execute(query)
            return [ cls(dict(zip(cls.ATTRIBUTES, row))) for row in cursor ]
        except:
            raise
