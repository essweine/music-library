import sqlite3, re
from datetime import datetime
from dateutil.parser import parse as parsedate

from ..util.db import Subquery, View, Query
from .property import TRACK_PROPS
from .recording import RecordingSummary
from .station import Station, StationTable

RECORDING_OPTIONS = {
    "recording": "text",
    "recording_rating": "rating",
    "sound_rating": "rating",
    "recording_date": "date",
    "title": "text",
    "artist": "category",
    "composer": "category",
    "genre": "options",
}

STATION_OPTIONS = {
    "name": "text",
    "rating": "rating",
    "minutes_listened": "number",
    "last_listened": "timestamp",
}

TRACK_SEARCH_SUBQUERY = Subquery([
    ("recording_id", None),
    ("filename", None),
    ("title", None),
    ("rating", None),
    ("recording", None),
    ("recording_date", None),
    ("recording_rating", None),
    ("sound_rating", None),
    ("official", None),
], "recording_track", False)

LibrarySearchView = View("library_search", (TRACK_SEARCH_SUBQUERY, TRACK_PROPS))

class Search(object):

    OPERATORS = {
        "text": "like",
        "rating": ">=",
        "category": "like",
        "options": "like",
        "timestamp": ">=",
        "number": ">=",
    }

    @classmethod
    def recording(cls, cursor, params):

        match = Query(LibrarySearchView.name, [ ("recording_id", None) ], True)
        cls._parse_params(match, params["match"], RECORDING_OPTIONS)

        exclude = Query(LibrarySearchView.name, [ ("recording_id", None) ], True)
        cls._parse_params(exclude, params["exclude"], RECORDING_OPTIONS)

        if not params["official"] and params["nonofficial"]:
            match.compare("official", False, "=")
        elif not params["nonofficial"] and params["official"]:
            match.compare("official", True, "=")

        if params["unrated"]:
            match.compare("recording_rating", "null", "is")

        if match.conditions and exclude.conditions:
            query = f"select * from recording_summary where id in ({match}) and id not in ({exclude})"
        elif match.conditions:
            query = f"select * from recording_summary where id in ({match})"
        elif exclude.conditions:
            query = f"select * from recording_summary where id not in ({exclude})"
        else:
            query = f"select * from recording_summary"

        cursor.row_factory = RecordingSummary.row_factory
        cursor.execute(query, match.values + exclude.values)

    @classmethod
    def station(cls, cursor, params):

        match = Query(StationTable.name, [ ("id", None) ], True)
        cls._parse_params(match, params["match"], STATION_OPTIONS)

        exclude = Query(StationTable.name, [ ("id", None) ], True)
        cls._parse_params(exclude, params["exclude"], STATION_OPTIONS)

        if match.conditions and exclude.conditions:
            query = f"select * from station where id in ({match}) and id not in ({exclude})"
        elif match.conditions:
            query = f"select * from station where id in ({match})"
        elif exclude.conditions:
            query = f"select * from station where id not in ({exclude})"
        else:
            query = f"select * from station"

        cursor.row_factory = Station.row_factory
        cursor.execute(query, match.values + exclude.values)

    @classmethod
    def _parse_params(cls, query, params, options):

        for item in params:
            param, val = item.popitem()
            param_type = options[param]
            if param_type == "date":
                cls._parse_date(query, val, cond_type == "match")
            elif param_type in [ "category", "options" ]:
                op = cls.OPERATORS[param_type]
                query.compare("category", param, "=")
                if param_type == "options":
                    query.compare("value", val, "=")
                else:
                    query.contains("value", val)
            elif param_type == "text":
                query.contains(param, val)
            else:
                query.compare(param, val, cls.OPERATORS[param_type])

    @staticmethod
    def _parse_date(query, val, match):

        try:
            year, month, day = re.split("[-/]", re.sub("\*+", "%", val))
            month = month.zfill(2) if month != "%" else month
            day = day.zfill(2) if day != "%" else day
        except:
            raise Exception(f"Invalid date query: {val}")

        conditions, values = [ ], [ ]

        if "*" not in val:
            query.compare("recording_date", val, "=" if match else "!=")

        if year != "%":
            if "%" in year:
                op = "like" if match else "not like"
            else:
                op = "=" if match else "!="
            query.compare(f"strftime('%Y', recording_date", val, op)

        if month != "%":
            query.compare(f"strftime('%m', recording_date)", val, "=" if match else "!=")

        if day != "%":
            query.compare(f"strftime('%d', recording_date)", val, "=" if match else "!=")

