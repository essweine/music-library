import re
from copy import deepcopy

from .query import Query

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

OPERATORS = {
    "text": "like",
    "rating": ">=",
    "category": "like",
    "options": "like",
    "timestamp": ">=",
    "number": ">=",
}

class Search(object):

    def __init_subclass__(cls):

        required_attrs = [ "search_options", "search_checkboxes", "search_sort_columns" ]
        if not all([ attr in cls.__dict__ for attr in required_attrs ]):
            raise Exception(", ".join(required_attrs) + " are required to add search")
        if "search_source" not in cls.__dict__:
            cls.search_source = cls
        if "search_column" not in cls.__dict__ and "identifier_col" in cls.__dict__:
            cls.search_column = cls.identifier_col
        elif "identifier_col" not in cls.__dict__:
            raise Exception("No search_column or identifier_col defined")
        super().__init_subclass__()

    @classmethod
    def search(cls, cursor, params):

        order = ", ".join(params["sort"]) + " " + params["order"]
        query = Query(cls, distinct = True, order = order, limit = params["limit"])
        cls._add_params(query, params)
        query.execute(cursor, cls.row_factory)

    @classmethod
    def aggregate(cls, cursor, agg_column, params):

        columns = [ (agg_column, None), ("total", f"count({cls.identifier_col})") ]
        query = Query(cls, columns, distinct = True, group = agg_column, order = agg_column)
        cls._add_params(query, params)
        query.execute(cursor)

    @classmethod
    def search_configuration(cls, cursor):

        query = deepcopy(DEFAULT_QUERY)
        query["sort"] = cls.search_sort_columns

        config = { }
        # Sort this by display name
        for param, details in sorted(cls.search_options.items(), key = lambda v: v[1][1]):
            param_type, display = details
            config[param] = {
                "display": display,
                "type": param_type if param_type in [ "options", "rating", "date_search" ] else "text",
                "values": [ ],
            }
            if param_type == "options":
                values = cls.property_values(cursor, param)
                config[param]["values"] = values[param]

        return {
            "search_options": config,
            "checkboxes": cls.search_checkboxes,
            "default_query": query
        }

    @classmethod
    def _add_params(cls, query, params):

        match, exclude = cls._get_subqueries(params)
        if match.conditions:
            query.compare_subquery(cls.identifier_col, match)
        if exclude.conditions:
            query.compare_subquery(cls.identifier_col, exclude, False)

    @classmethod
    def _get_subqueries(cls, params):

        match = Query(cls.search_source, [ (cls.search_column, None) ], distinct = True)
        cls._parse_params(match, params["match"], True)

        exclude = Query(cls.search_source, [ (cls.search_column, None) ], distinct = True)
        cls._parse_params(exclude, params["exclude"], False)

        if "official" and "nonofficial" in params:
            if not params["official"] and params["nonofficial"]:
                match.compare("official", False, "=")
            elif not params["nonofficial"] and params["official"]:
                match.compare("official", True, "=")

        if "unrated" in params and params["unrated"]:
            match.compare("rating", None, "is")

        return match, exclude

    @classmethod
    def _parse_params(cls, query, params, match):

        for item in params:
            param, val = item.popitem()
            param_type, display = cls.search_options[param]
            if param_type == "date_search":
                cls._parse_date(query, val, match)
            elif param_type in [ "category", "options" ]:
                op = OPERATORS[param_type]
                query.compare("category", param, "=")
                if param_type == "options":
                    query.compare("value", val, "=")
                else:
                    query.contains("value", val)
            elif param_type == "text":
                query.contains(param, val)
            else:
                query.compare(param, val, OPERATORS[param_type])

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

    @staticmethod
    def property_values(cursor, prop_name):

        cursor.execute("select distinct value from property where category=? order by value", (prop_name, ))
        return { prop_name: [ val for (val, ) in cursor.fetchall() ] }

