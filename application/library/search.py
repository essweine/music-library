from ..util import BaseObject, Search
from ..util.db import Subquery, JoinedView, Query
from .property import PropertyAggregate, PropertyView, TRACK_AGGREGATE, TRACK_PROPS
from .recording import RecordingTable, TrackTable
from .playlist import PlaylistEntry

SUMMARY_SUBQUERY = Subquery([
    ("id", None),
    ("title", None),
    ("recording_date", None),
    ("rating", None),
    ("sound_rating", None),
    ("official", None),
], RecordingTable, False)

RecordingArtistView = PropertyView("artist", "recording_id")

ARTIST_SUBQUERY = Subquery([
    ("id", "recording_id"),
    ("artist", "value"),
], RecordingArtistView, False)

# This view links the track data stored with the artist to the recording
RecordingSummaryView = JoinedView("recording_summary", (SUMMARY_SUBQUERY, ARTIST_SUBQUERY))

# This view links data stored with the track to data stored with the recording
TRACK_SUBQUERY = Subquery([ (col.name, None) for col in TrackTable.columns ], TrackTable, False)
RECORDING_SUBQUERY = Subquery([
    ("recording_id", "id"),
    ("recording", "title"),
    ("artwork", None),
    ("recording_date", None),
    ("recording_rating", "rating"),
    ("sound_rating", None),
    ("official", None),
], RecordingTable, False)
RecordingTrackView = JoinedView("recording_track", (TRACK_SUBQUERY, RECORDING_SUBQUERY))

# This view adds aggregated property data to the combined recording/track data
# There is one row per filename, which contains all the data the player needs to display the track
PLAYLIST_SUBQUERY = Subquery([
    ("recording_id", None),
    ("filename", None),
    ("title", None),
    ("rating", None),
    ("recording", None),
    ("artwork", None),
], RecordingTrackView, False)
PlaylistTrackView = JoinedView("playlist_track", (PLAYLIST_SUBQUERY, TRACK_PROPS), TRACK_AGGREGATE)

# This view adds unaggregated property data to the combined recording/track data
# There is one row per property per filename, which allows searching for tracks by property value
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

RECORDING_SEARCH_OPTIONS = {
    "recording": ("text", "Title"),
    "recording_rating": ("rating", "Minimum Rating"),
    "sound_rating": ("rating", "Minimum Sound Rating"),
    "recording_date": ("date_search", "Date"),
    "title": ("text", "Contains Track"),
    "artist": ("category", "Artist"),
    "composer": ("category", "Composer"),
    "genre": ("options", "Genre"),
}

TRACK_SEARCH_OPTIONS = {
    "recording": ("text", "From Recording"),
    "title": ("text", "Title"),
    "rating": ("rating", "Minimum Rating"),
    "artist": ("category", "Artist"),
    "guest": ("category", "Guest Artist"),
    "composer": ("category", "Composer"),
    "genre": ("options", "Genre"),
}

LIBRARY_CHECKBOXES = { "official": "Official", "nonofficial": "Non-official", "unrated": "Unrated Only" }

class RecordingSummary(BaseObject):

    Search = Search(
        RECORDING_SEARCH_OPTIONS,
        LIBRARY_CHECKBOXES,
        LibrarySearchView,
        ("recording_id", None),
        [ "artist", "recording_date" ]
    )

    def __init__(self, **recording):

        for name, definition in SUMMARY_SUBQUERY.columns + ARTIST_SUBQUERY.columns:
            self.__setattr__(name, recording.get(name))
        self.artist = sorted(self.artist.split("::"))

    @classmethod
    def get_all(cls, cursor):

        RecordingSummaryView.get_all(cursor, cls.row_factory, "artist")

    @classmethod
    def search(cls, cursor, params):

        query = Query(RecordingSummaryView, distinct = True)
        cls.Search.get_items(cursor, query, "id", params, cls.row_factory)

    @classmethod
    def search_configuration(cls, cursor):

        return cls.Search.get_configuration(cursor)

class PlaylistTrack(PropertyAggregate):

    PROPERTIES = [ "artist" ]

    Search = Search(
        TRACK_SEARCH_OPTIONS,
        LIBRARY_CHECKBOXES,
        LibrarySearchView,
        ("filename", None),
        [ "title" ]
    )

    def __init__(self, **track):

        super(PlaylistTrack, self).__init__(track)
        for name, definition in PLAYLIST_SUBQUERY.columns:
            self.__setattr__(name, track.get(name))

    @classmethod
    def search(cls, cursor, params):

        query = Query(PlaylistTrackView, distinct = True)
        cls.Search.get_items(cursor, query, "filename", params, cls.row_factory)

    @classmethod
    def search_configuration(cls, cursor):

        return cls.Search.get_configuration(cursor)

    @classmethod
    def from_filenames(cls, cursor, filenames):

        sort = lambda track: filenames.index(track.filename)
        Query(PlaylistTrackView).compare_set("filename", filenames).execute(cursor, cls.row_factory)
        return sorted(cursor.fetchall(), key = sort)

    @classmethod
    def from_playlist_id(cls, cursor, playlist_id):

        PlaylistEntry.get(cursor, playlist_id)
        filenames = [ entry.filename for entry in cursor.fetchall() ]
        return cls.from_filenames(cursor, filenames)

