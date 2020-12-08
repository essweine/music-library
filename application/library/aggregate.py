from ..util import Search
from ..util.db import Query
from .search import LibrarySearchView, RECORDING_SEARCH_OPTIONS, TRACK_SEARCH_OPTIONS, LIBRARY_CHECKBOXES

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

        columns = [ ("rating", None), ("total", "count(distinct filename)") ]
        query = Query(LibrarySearchView, columns, distinct = True, group = "rating", order = "rating")
        cls.Search.get_aggregate(cursor, query, "filename", params)

class RecordingAggregation(object):

    Search = Search(
        RECORDING_SEARCH_OPTIONS,
        LIBRARY_CHECKBOXES,
        LibrarySearchView,
        ("recording_id", None),
        [ "artist", "recording_date" ]
    )

    @classmethod
    def aggregate(cls, cursor, aggregate_type, params):

        if aggregate_type == "rating":
            cls.rating(cursor, params)
        else:
            raise ValueError(f"Invalid aggregate type {aggregate_type}")

    @classmethod
    def rating(cls, cursor, params):

        columns = [ ("rating", "recording_rating"), ("total", "count(distinct recording_id)") ]
        query = Query(LibrarySearchView, columns, distinct = True, group = "recording_rating", order = "rating")
        cls.Search.get_aggregate(cursor, query, "recording_id", params)

    @classmethod
    def sound_rating(cls, cursor, params):

        columns = [ ("rating", "sound_rating"), ("total", "count(distinct recording_id)") ]
        query = Query(LibrarySearchView, columns, distinct = True, group = "sound_rating", order = "rating")
        cls.Search.get_aggregate(cursor, query, "recording_id", params)
