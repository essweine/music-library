from ..util.db import Column, Subquery, Table, View, Query
from .property import PropertyView, TRACK_PROPS, TRACK_AGGREGATE

TRACK_COLUMNS = [
    Column("recording_id", "text", False, True),
    Column("filename", "text", False, True),
    Column("track_num", "int", True, False),
    Column("title", "text", True, True),
    Column("rating", "int", True, True),
]

TRACK_SUBQUERY = Subquery([ (col.name, None) for col in TRACK_COLUMNS ], "track", False)

RECORDING_SUBQUERY = Subquery([
    ("recording_id", "id"),
    ("recording", "title"),
    ("artwork", None),
], "recording", False)

PLAYLIST_SUBQUERY = Subquery([
    ("recording_id", None),
    ("filename", None),
    ("title", None),
    ("rating", None),
    ("recording", None),
    ("artwork", None),
], "recording_track", False)

TrackTable = Table("track", TRACK_COLUMNS, "filename")
RecordingTrackView = View("recording_track", (TRACK_SUBQUERY, RECORDING_SUBQUERY))
LibraryTrackView = View("library_track", (TRACK_SUBQUERY, TRACK_PROPS), TRACK_AGGREGATE)
PlaylistTrackView = View("playlist_track", (PLAYLIST_SUBQUERY, TRACK_PROPS), TRACK_AGGREGATE)

class LibraryTrack(PropertyView):

    PROPERTIES = [ "artist", "composer", "guest", "genre" ]

    def __init__(self, **track):

        super(LibraryTrack, self).__init__(track)
        for name, definition in TRACK_SUBQUERY.columns:
            self.__setattr__(name, track.get(name))

    @classmethod
    def create(cls, cursor, track):

        cls._update_properties(cursor, track)
        TrackTable.insert(cursor, track)

    @classmethod
    def update(cls, cursor, track):

        cls._update_properties(cursor, track)
        TrackTable.update(cursor, track)

class PlaylistTrack(PropertyView):

    PROPERTIES = [ "artist" ]

    def __init__(self, **track):

        super(PlaylistTrack, self).__init__(track)
        for name, definition in PLAYLIST_SUBQUERY.columns:
            self.__setattr__(name, track.get(name))

    @classmethod
    def from_filenames(cls, cursor, filenames):

        Query("playlist_track").compare_set("filename", filenames).execute(cursor, cls.row_factory)
