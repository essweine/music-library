import sqlite3
from datetime import datetime

from ..util import JsonSerializable
from ..db import Column, insert_statement, update_statement

STATION_COLUMNS = [
    Column("name", "text", None, True),
    Column("url", "text", None, True),
    Column("website", "text", None, True),
    Column("rating", "int", None, False),
    Column("minutes_listened", "int", 0, False),
    Column("last_listened", "timestamp", None, False),
    Column("added_date", "date", None, False),
]

class Station(JsonSerializable):

    def __init__(self, station = { }):

        for column in STATION_COLUMNS:
            self.__setattr__(column.name, station.get(column.name, column.default))

    @classmethod
    def get(cls, cursor, name):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from station where name=?", (name, ))
        return cursor.fetchone()

    @classmethod
    def get_all(cls, cursor):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from station order by name")

    @staticmethod
    def create(cursor, station):

        station["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        stmt = insert_statement("station", STATION_COLUMNS)
        values = [ station.get(col.name, col.default) for col in STATION_COLUMNS ]
        cursor.execute(stmt, values)

    @staticmethod
    def update(cursor, name, station):

        stmt = update_statement("station", "name", STATION_COLUMNS)
        values = [ station.get(col.name, col.default) for col in STATION_COLUMNS if col.updateable ] + [ name ]
        cursor.execute(stmt, values)

    @staticmethod
    def update_history(cursor, entry):

        duration = round((entry.end_time - entry.start_time).total_seconds() / 60)
        stmt = "update station set minutes_listened=minutes_listened + ?, last_listened=? where url=?"
        values = (duration, entry.end_time, entry.url)
        cursor.execute(stmt, values)

    @staticmethod
    def set_rating(cursor, rating):

        cursor.execute("update station set rating=? where name=?", (rating.value, rating.item_id))

    @staticmethod
    def delete(cursor, name):

        cursor.execute("delete from station where name=?", (name, ))

    @classmethod
    def from_url(cls, cursor, url):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from station where url=?", (url, ))
        return cursor.fetchone()

    @classmethod
    def search(cls, cursor, criteria):

        ops = {
            "name": { "match": "like", "exclude": "not like" },
            "rating": { "match": ">=", "exclude": "<" },
            "minutes_listened": { "match": ">=", "exclude": "<" },
            "last_listened": { "match": ">=", "exclude": "<" },
        }
        
        conditions, values = [ ], [ ]
        for cond_type in [ "match", "exclude" ]:
            for item in criteria[cond_type]:
                col, val = item.popitem()
                conditions.append("{0} {1} ?".format(col, ops[col][cond_type]))
                values.append(val)

        query = "select * from station"
        if conditions:
            query += " where " + " and ".join(conditions)
        query += " order by name"

        cursor.row_factory = cls.row_factory
        cursor.execute(query, values)

