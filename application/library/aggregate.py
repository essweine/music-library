from ..util import Search
from ..util.db import Query
from .search import RecordingTrackView, LibrarySearchView, TRACK_SEARCH_OPTIONS

class TrackAggregation(object):

    Search = Search(TRACK_SEARCH_OPTIONS, LibrarySearchView, ("filename", None), [ ])

    @classmethod
    def aggregate(cls, cursor, aggregate_type, params):

        if aggregate_type == "rating":
            cls.rating(cursor, params)
        else:
            raise ValueError(f"Invalid aggregate type {aggregate_type}")

    @classmethod
    def rating(cls, cursor, params):

        columns = [ ("rating", None), ("tracks", "count(distinct filename)") ]
        query = Query(PlaylistTrackView, columns, group = "rating", order = "rating")
        cls.Search.get_aggregate(cursor, query, "filename", params)


