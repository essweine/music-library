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
    def create(cursor, entry):

        statement = insert_statement("history", HISTORY_COLUMNS)
        values = [ entry.get(col.name) for col in HISTORY_COLUMNS ]
        try:
            cursor.execute(statement, values)
        except:
            raise

