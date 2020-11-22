import sqlite3, re
from collections import namedtuple
from copy import deepcopy
from datetime import datetime

from .db import Query

DEFAULT_QUERY = {
    "match": [ ],
    "exclude": [ ],
    "official": True,
    "nonofficial": True,
    "unrated": False,
    "sort": [ ],
    "order": "asc",
    "limit": None,
}

class Search(object):

    OPERATORS = {
        "text": "like",
        "rating": ">=",
        "category": "like",
        "options": "like",
        "timestamp": ">=",
        "number": ">=",
    }

    def __init__(self, options, checkboxes, search_table, search_column, sort):

        self.options       = options
        self.checkboxes    = checkboxes
        self.search_table  = search_table
        self.search_column = search_column
        self.sort          = sort

    def get_items(self, cursor, query, item_id, params, row_factory):

        match, exclude = self._get_subqueries(params)
        query.order = ", ".join(params["sort"]) + " " + params["order"] if "sort" in params else None
        query.limit = params["limit"] if "limit" in params else None
        if match.conditions:
            query.compare_subquery(item_id, match)
        if exclude.conditions:
            query.compare_subquery(item_id, exclude, False)
        query.execute(cursor, row_factory)

    def get_aggregate(self, cursor, query, item_id, params):

        match, exclude = self._get_subqueries(params)
        if match.conditions:
            query.compare_subquery(item_id, match)
        if exclude.conditions:
            query.compare_subquery(item_id, exclude, False)
        query.execute(cursor)

    def get_configuration(self, cursor):

        query = deepcopy(DEFAULT_QUERY)
        query["sort"] = self.sort

        config = { }
        # Sort this by display name
        for param, details in sorted(self.options.items(), key = lambda v: v[1][1]):
            param_type, display = details
            config[param] = {
                "display": display,
                "type": param_type if param_type in [ "options", "rating", "date_search" ] else "text",
                "values": [ ],
            }
            if param_type == "options":
                values = self.property_values(cursor, param)
                config[param]["values"] = values[param]

        return {
            "search_options": config,
            "checkboxes": self.checkboxes,
            "default_query": query
        }

    def property_values(self, cursor, prop_name):

        cursor.execute("select distinct value from property where category=? order by value", (prop_name, ))
        return { prop_name: [ val for (val, ) in cursor.fetchall() ] }

    def _get_subqueries(self, params):

        match = Query(self.search_table, [ self.search_column ], distinct = True)
        self._parse_params(match, params["match"], True)

        exclude = Query(self.search_table, [ self.search_column ], distinct = True)
        self._parse_params(exclude, params["exclude"], False)

        if "official" and "nonofficial" in params:
            if not params["official"] and params["nonofficial"]:
                match.compare("official", False, "=")
            elif not params["nonofficial"] and params["official"]:
                match.compare("official", True, "=")

        if "unrated" in params and params["unrated"]:
            match.compare("rating", None, "is")

        return match, exclude

    def _parse_params(self, query, params, match):

        for item in params:
            param, val = item.popitem()
            param_type, display = self.options[param]
            if param_type == "date_search":
                self._parse_date(query, val, match)
            elif param_type in [ "category", "options" ]:
                op = self.OPERATORS[param_type]
                query.compare("category", param, "=")
                if param_type == "options":
                    query.compare("value", val, "=")
                else:
                    query.contains("value", val)
            elif param_type == "text":
                query.contains(param, val)
            else:
                query.compare(param, val, self.OPERATORS[param_type])

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

