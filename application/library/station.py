import sqlite3
from datetime import datetime
from uuid import uuid4

from ..util import BaseObject
from ..util.db import Column, Table

STATION_COLUMNS = [
    Column("id", "text", False, True),
    Column("name", "text", True, True),
    Column("url", "text", True, True),
    Column("website", "text", True, True),
    Column("rating", "int", False, False),
    Column("minutes_listened", "int", None, False),
    Column("last_listened", "timestamp", False, False),
    Column("added_date", "date", False, False),
]

StationTable = Table("station", STATION_COLUMNS, "id")

class Station(BaseObject):

    def __init__(self, **station):

        for column in STATION_COLUMNS:
            self.__setattr__(column.name, station.get(column.name))

    @classmethod
    def get(cls, cursor, station_id):

        StationTable.get(cursor, station_id, cls.row_factory)
        return cursor.fetchone()

    @classmethod
    def get_all(cls, cursor):

        StationTable.get_all(cursor, cls.row_factory)

    @staticmethod
    def create(cursor, station):

        station["id"] = str(uuid4())
        station["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        station["minutes_listened"] = 0
        StationTable.insert(cursor, station)

    @staticmethod
    def delete(cursor, station_id):

        StationTable.delete(cursor, station_id)

    @staticmethod
    def update(cursor, station):

        StationTable.update(cursor, station)

    @staticmethod
    def set_rating(cursor, rating):

        cursor.execute("update station set rating=? where id=?", (rating.value, rating.item_id))

    @staticmethod
    def update_history(cursor, entry):

        duration = round((entry.end_time - entry.start_time).total_seconds() / 60)
        stmt = "update station set minutes_listened=minutes_listened + ?, last_listened=? where url=?"
        values = (duration, entry.end_time, entry.url)
        cursor.execute(stmt, values)

    @classmethod
    def from_url(cls, cursor, url):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from station where url=?", (url, ))
        return cursor.fetchone()

