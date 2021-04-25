import sys
import json
from datetime import datetime

from ..util import BaseObject, BaseApiHandler

from .db import Query
from .recording import RecordingSummaryView, RecordingTable, LibrarySearchView
from .history import HistoryTable

class Suggestion(BaseObject):

    @staticmethod
    def on_this_date(cursor, official):

        today = datetime.now()
        subquery = Query(RecordingTable, [ ("id", None) ])
        subquery.compare(f"strftime('%m', recording_date)", str(today.month).zfill(2), "=")
        subquery.compare(f"strftime('%d', recording_date)", str(today.day).zfill(2), "=")
        subquery.compare("official", official, "=")
        query = Query(RecordingSummaryView).compare_subquery("id", subquery)
        query.execute(cursor, RecordingSummaryView.row_factory)

    @staticmethod
    def unlistened(cursor, official):

        tracks = Query(HistoryTable, [ ("filename", None) ], distinct = True)
        recordings = Query(
            LibrarySearchView,
            [ ("recording_id", None) ],
            distinct = True
        ).compare_subquery("filename", tracks, False).compare("official", official, "=")
        query = Query(
            RecordingSummaryView,
            [ ("*", None), ("random_id", "random()") ],
            order = "random_id",
            limit = 10
        ).compare_subquery("id", recordings)
        query.execute(cursor, RecordingSummaryView.row_factory)

    @staticmethod
    def random(cursor, official):

        query = Query(
            RecordingSummaryView,
            [ ("*", None), ("random_id", "random()") ],
            order = "random_id",
            limit = 10
        ).compare("official", official, "=")
        query.execute(cursor, RecordingSummaryView.row_factory)

class SuggestionHandler(BaseApiHandler):

    def get(self, suggestion_type):

        try:
            official = self.get_query_argument("official") == "true"
            if suggestion_type == "on-this-date":
                results = self.db_query(Suggestion.on_this_date, official)
            elif suggestion_type == "unlistened":
                results = self.db_query(Suggestion.unlistened, official)
            elif suggestion_type == "random":
                results = self.db_query(Suggestion.random, official)
            else:
                self.write_error(400, log_message = f"Invalid suggestion type: {suggestion_type}")
            self.write(json.dumps(results, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = f"Could not execute recording query", exc_info = sys.exc_info())

