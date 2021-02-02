from datetime import datetime
from uuid import uuid4

from .db import Column, ItemTable, Query
from .db import Table, JoinedView, ItemTable, ItemCreator
from .db.search import Search

class StationTable(Table, ItemTable, ItemCreator, Search):

    name = "station"
    columns = [
        Column("id", "text", False, True),
        Column("name", "text", True, True),
        Column("url", "text", True, True),
        Column("website", "text", True, True),
        Column("rating", "int", False, False),
        Column("minutes_listened", "int", None, False),
        Column("last_listened", "timestamp", False, False),
        Column("added_date", "date", False, False),
    ]
    identifier_col = "id"
    item_type = "Station"

    search_options = {
        "name": ("text", "Name"),
        "rating": ("rating", "Minimum Rating"),
        "minutes_listened": ("number", "Minutes Listened"),
        "last_listened": ("standard_date", "Listened Since"),
    }
    search_checkboxes   = { "unrated": "Unrated Only" }
    search_sort_columns = [ "name" ]

    @classmethod
    def create(cls, cursor, station):

        station["id"] = str(uuid4())
        station["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        station["minutes_listened"] = 0
        cls.insert(cursor, station)
        return station["id"]

    @classmethod
    def update_history(cls, cursor, entry):

        duration = round((entry.end_time - entry.start_time).total_seconds() / 60)
        stmt = "update station set minutes_listened=minutes_listened + ?, last_listened=? where url=?"
        values = (duration, entry.end_time, entry.url)
        cursor.execute(stmt, values)

    @classmethod
    def from_url(cls, cursor, url):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from station where url=?", (url, ))
        return cursor.fetchone()

