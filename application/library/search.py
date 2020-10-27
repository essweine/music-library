import sqlite3, re
from datetime import datetime
from dateutil.parser import parse as parsedate

from ..util.db import Subquery, JoinedView, Query
from .property import TRACK_PROPS
from .recording import RecordingTrackView
from .recording_summary import RecordingSummary
from .station import Station, StationTable

RECORDING_OPTIONS = {
    "recording": ("text", "Title"),
    "recording_rating": ("rating", "Minimum Rating"),
    "sound_rating": ("rating", "Minimum Sound Rating"),
    "recording_date": ("date_search", "Date"),
    "title": ("text", "Contains Track"),
    "artist": ("category", "Artist"),
    "composer": ("category", "Composer"),
    "genre": ("options", "Genre"),
}

STATION_OPTIONS = {
    "name": ("text", "Name"),
    "rating": ("rating", "Minimum Rating"),
    "minutes_listened": ("number", "Minutes Listened"),
    "last_listened": ("date", "Listened Since"),
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
], RecordingTrackView, False)

LibrarySearchView = JoinedView("library_search", (TRACK_SEARCH_SUBQUERY, TRACK_PROPS))

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
        cls._parse_params(match, params["match"], RECORDING_OPTIONS, True)

        exclude = Query(LibrarySearchView.name, [ ("recording_id", None) ], True)
        cls._parse_params(exclude, params["exclude"], RECORDING_OPTIONS, False)

        if not params["official"] and params["nonofficial"]:
            match.compare("official", False, "=")
        elif not params["nonofficial"] and params["official"]:
            match.compare("official", True, "=")

        if params["unrated"]:
            match.compare("recording_rating", None, "is")

        order = "order by " + ", ".join(params["sort"]) + " " + params["order"]

        if match.conditions and exclude.conditions:
            query = f"select * from recording_summary where id in ({match}) and id not in ({exclude}) {order}"
        elif match.conditions:
            query = f"select * from recording_summary where id in ({match}) {order}"
        elif exclude.conditions:
            query = f"select * from recording_summary where id not in ({exclude}) {order}"
        else:
            query = f"select * from recording_summary {order}"

        cursor.row_factory = RecordingSummary.row_factory
        cursor.execute(query, match.values + exclude.values)

    @classmethod
    def station(cls, cursor, params):

        match = Query(StationTable.name, [ ("id", None) ], True)
        cls._parse_params(match, params["match"], STATION_OPTIONS, True)

        exclude = Query(StationTable.name, [ ("id", None) ], True)
        cls._parse_params(exclude, params["exclude"], STATION_OPTIONS, True)

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
    def configuration(cls, cursor, search_type):

        if search_type == "recording":
            options = RECORDING_OPTIONS
        elif search_type == "station":
            options = STATION_OPTIONS
        else:
            raise ValueError("Invalid search type")

        config = { }
        # Sort this by display name
        for param, details in sorted(options.items(), key = lambda v: v[1][1]):
            param_type, display = details
            config[param] = {
                "display": display,
                "type": param_type if param_type in [ "options", "rating", "date_search" ] else "text",
                "values": [ ],
            }
            if param_type == "options":
                values = cls.property_values(cursor, param)
                config[param]["values"] = values[param]
        return config

    @classmethod
    def property_values(cls, cursor, prop_name):

        cursor.execute("select distinct value from property where category=?", (prop_name, ))
        return { prop_name: [ val for (val, ) in cursor.fetchall() ] }

    @classmethod
    def _parse_params(cls, query, params, options, cond_type):

        for item in params:
            param, val = item.popitem()
            param_type, display = options[param]
            if param_type == "date_search":
                cls._parse_date(query, val, cond_type)
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

        if "*" in val:
            try:
                year, month, day = re.split("[-/]", re.sub("\*+", "%", val))
                month = month.zfill(2) if month != "%" else month
                day = day.zfill(2) if day != "%" else day
            except:
                raise Exception(f"Invalid date query: {val}")

            if year != "%":
                if "%" in year:
                    op = "like" if match else "not like"
                else:
                    op = "=" if match else "!="
                query.compare(f"strftime('%Y', recording_date)", year, op)

            if month != "%":
                query.compare(f"strftime('%m', recording_date)", month, "=" if match else "!=")

            if day != "%":
                query.compare(f"strftime('%d', recording_date)", day, "=" if match else "!=")

        else:
            query.compare("recording_date", val, "=" if match else "!=")
