from ..util import Search
from ..util.db import Query
from .search import LibrarySearchView, TRACK_SEARCH_OPTIONS, LIBRARY_CHECKBOXES

class TrackAggregation(object):

    Search = Search(TRACK_SEARCH_OPTIONS, LIBRARY_CHECKBOXES, LibrarySearchView, ("filename", None), [ ])

    @classmethod
    def aggregate(cls, cursor, aggregate_type, params):

        if aggregate_type == "rating":
            cls.rating(cursor, params)
        else:
            raise ValueError(f"Invalid aggregate type {aggregate_type}")

    @classmethod
    def rating(cls, cursor, params):

        columns = [ ("rating", None), ("tracks", "count(distinct filename)") ]
        query = Query(LibrarySearchView, columns, distinct = True, group = "rating", order = "rating")
        cls.Search.get_aggregate(cursor, query, "filename", params)


