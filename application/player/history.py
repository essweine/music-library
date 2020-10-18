from datetime import datetime

from ..util.db import Column, Table, View, Subquery, Query
from ..util import JsonSerializable
from ..library.property import PropertyView

HISTORY_COLUMNS = [
    Column("filename", "text", False, True),
    Column("start_time", "timestamp", False, False),
    Column("end_time", "timestamp", False, False),
]

HISTORY_SUBQUERY = Subquery([
    ("filename", None),
    ("end_time", None),
], "history", False)

PLAYLIST_SUBQUERY = Subquery([
    ("filename", None),
    ("title", None),
    ("recording_id", None),
    ("recording", None),
    ("rating", None),
    ("category", None),
    ("value", None),
], "playlist_track", False)

HISTORY_TRACK_COLUMNS = [
    ("filename", None),
    ("title", None),
    ("recording_id", None),
    ("recording", None),
    ("rating", None),
    ("count", "count(*)"),
    ("last_listened", "max(end_time)"),
]

HistoryTable = Table("history", HISTORY_COLUMNS, "filename")
HistoryTrackView = View("history_track", (HISTORY_SUBQUERY, PLAYLIST_SUBQUERY))

class HistoryTrack(PropertyView):

    PROPERTIES = [ "artist" ]

    def __init__(self, track = { }):

        super(HistoryTrack, self).__init__(track)
        for name, definition in HISTORY_TRACK_COLUMNS:
            self.__setattr__(name, track.get(name))

class History(JsonSerializable):

    def __init__(self, entry = { }):

        for column in HISTORY_COLUMNS:
            self.__setattr__(column.name, entry.get(column.name, column.default))

    @staticmethod
    def create(cursor, entry):

        HistoryTable.insert(cursor, entry.as_dict())

    @classmethod
    def tracks_from_period(cls, cursor, start, end):

        query = Query("history_track", HISTORY_TRACK_COLUMNS, group = "filename", order = "last_listened desc")
        query.execute(cursor, HistoryTrack.row_factory)

