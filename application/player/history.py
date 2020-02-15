from ..db import Column, insert_statement

HISTORY_COLUMNS = [
    Column("filename", "text", None, False),
    Column("start_time", "date", None, False),
    Column("end_time", "date", None, False),
]

class History(object):

    @staticmethod
    def add_entry(cursor, **entry):

        statement = insert_statement("history", HISTORY_COLUMNS)
        values = [ entry.get(col.name) for col in HISTORY_COLUMNS ]
        try:
            cursor.execute(statement, values)
        except:
            raise
