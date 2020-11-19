from datetime import datetime

from ..util.db import Column, Table, JoinedView, Subquery, Query
from ..util import BaseObject
from ..library.property import PropertyAggregate
from ..library.search import PlaylistTrackView

HISTORY_COLUMNS = [
    Column("filename", "text", False, True),
    Column("start_time", "timestamp", False, False),
    Column("end_time", "timestamp", False, False),
]
HistoryTable = Table("history", HISTORY_COLUMNS)

HISTORY_SUBQUERY = Subquery([
    ("filename", None),
    ("end_time", None),
], HistoryTable, False)

PLAYLIST_SUBQUERY = Subquery([
    ("filename", None),
    ("title", None),
    ("recording_id", None),
    ("recording", None),
    ("rating", None),
    ("category", None),
    ("value", None),
], PlaylistTrackView, False)

HISTORY_TRACK_COLUMNS = [
    ("filename", None),
    ("title", None),
    ("recording_id", None),
    ("recording", None),
    ("rating", None),
    ("count", "count(*)"),
    ("last_listened", "max(end_time)"),
]

HistoryTrackView = JoinedView("history_track", (HISTORY_SUBQUERY, PLAYLIST_SUBQUERY))

class HistoryTrack(PropertyAggregate):

    PROPERTIES = [ "artist" ]

    def __init__(self, **track):

        super(HistoryTrack, self).__init__(track)
        for name, definition in HISTORY_TRACK_COLUMNS:
            self.__setattr__(name, track.get(name))

class History(BaseObject):

    def __init__(self, **entry):

        for column in HISTORY_COLUMNS:
            self.__setattr__(column.name, entry.get(column.name, column.default))

    @staticmethod
    def create(cursor, entry):

        HistoryTable.insert(cursor, entry.as_dict())

    @classmethod
    def tracks_from_period(cls, cursor, start, end):

        query = Query(HistoryTrackView,
            HISTORY_TRACK_COLUMNS + [ ("category", None), ("value", None) ],
            group = "filename", 
            order = "last_listened desc"
        )
        start = datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(end, "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%Y-%m-%d %H:%M:%S")
        query.compare("end_time", start, ">=")
        query.compare("end_time", end, "<")
        query.execute(cursor, HistoryTrack.row_factory)

