from ..util.db import Column, Subquery, Table, JoinedView, Query
from ..library.property import PropertyAggregate, TRACK_PROPS, TRACK_AGGREGATE
from ..library.recording import RecordingTrackView

PLAYLIST_SUBQUERY = Subquery([
    ("recording_id", None),
    ("filename", None),
    ("title", None),
    ("rating", None),
    ("recording", None),
    ("artwork", None),
], RecordingTrackView, False)

PlaylistTrackView = JoinedView("playlist_track", (PLAYLIST_SUBQUERY, TRACK_PROPS), TRACK_AGGREGATE)

class PlaylistTrack(PropertyAggregate):

    PROPERTIES = [ "artist" ]

    def __init__(self, **track):

        super(PlaylistTrack, self).__init__(track)
        for name, definition in PLAYLIST_SUBQUERY.columns:
            self.__setattr__(name, track.get(name))

    @classmethod
    def from_filenames(cls, cursor, filenames):

        Query("playlist_track").compare_set("filename", filenames).execute(cursor, cls.row_factory)
