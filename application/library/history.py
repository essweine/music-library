from datetime import datetime
from dateutil.tz import UTC, tzlocal

from ..util import BaseObject
from .db import Column, Table, JoinedView, Query, ItemCreator
from .recording import PlaylistTrackView

class HistoryTable(Table):

    name = "history"
    columns = [
        Column("filename", "text", False, True),
        Column("start_time", "timestamp", False, False),
        Column("end_time", "timestamp", False, False),
    ]

    @classmethod
    def update_history(cls, cursor, entry):
        data = {
            "filename": entry.info["filename"], 
            "start_time": entry.start_time,
            "end_time": entry.end_time
        }
        cls.insert(cursor, data)

class HistoryTrackView(JoinedView, ItemCreator):

    name = "history_track"
    subqueries = (
        Query(HistoryTable, [
            ("filename", None),
            ("end_time", None),
        ]),
        Query(PlaylistTrackView, [
            ("filename", None),
            ("title", None),
            ("recording_id", None),
            ("recording", None),
            ("rating", None),
            ("artist", None),
        ])
    )
    item_type = "HistoryTrack"

    aggregate_columns = [
        ("filename", None),
        ("title", None),
        ("recording_id", None),
        ("recording", None),
        ("rating", None),
        ("artist", None),
        ("count", "count(*)"),
        ("last_listened", "max(end_time)"),
    ]

    @classmethod
    def tracks_from_period(cls, cursor, start, end):

        query = Query(cls, cls.aggregate_columns, group = "filename", order = "last_listened desc")
        if start is not None:
            start = datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%Y-%m-%d %H:%M:%S")
            query.compare("end_time", start, ">=")
        if end is not None:
            end = datetime.strptime(end, "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%Y-%m-%d %H:%M:%S")
            query.compare("end_time", end, "<")
        query.execute(cursor, cls.row_factory)

    @classmethod
    def frequent_tracks(cls, cursor, num_tracks):

        query = Query(cls, 
            cls.aggregate_columns,
            group = "filename", 
            order = "count desc",
            limit = num_tracks
        ).compare("'count'", 0, ">")
        query.execute(cursor, cls.row_factory)

    @classmethod
    def track(cls, cursor, filename):

        to_value = lambda c, r: r[0].replace(tzinfo = UTC).astimezone(tzlocal()).strftime("%b %-d %Y %I:%M %P")
        query = Query(cls,
            [ ("end_time", None) ],
            order = "end_time desc",
        ).compare("filename", filename, "=")
        query.execute(cursor, to_value)

