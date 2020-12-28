# Classes
from .recording import Recording, LibraryTrack
from .search import RecordingSummary, PlaylistTrack
from .aggregate import TrackAggregation, RecordingAggregation
from .playlist import Playlist
from .station import Station

# Handlers
from .recording_handler import RecordingHandler, RecordingRootHandler, RecordingTrackHandler, RecordingTagHandler
from .recording_handler import RecordingSearchHandler, RecordingAggregationHandler
from .track_handler import TrackSearchHandler, TrackAggregationHandler
from .station_handler import StationHandler, StationRootHandler, StationSearchHandler
from .playlist_handler import PlaylistHandler, PlaylistRootHandler, PlaylistSearchHandler, PlaylistTrackHandler
from .rating_handler import RatingHandler
from .suggestion_handler import SuggestionHandler

LIBRARY_HANDLERS = [
    (r"/api/recording/search", RecordingSearchHandler),
    (r"/api/recording/aggregate/(.*)", RecordingAggregationHandler),
    (r"/api/recording/(.*)/tracks", RecordingTrackHandler),
    (r"/api/recording/(.*)/tags", RecordingTagHandler),
    (r"/api/recording/(.*)", RecordingHandler),
    (r"/api/recording", RecordingRootHandler),
    (r"/api/track/search", TrackSearchHandler),
    (r"/api/track/aggregate/(.*)", TrackAggregationHandler),
    (r"/api/playlist/search", PlaylistSearchHandler),
    (r"/api/playlist/(.*)/tracks", PlaylistTrackHandler),
    (r"/api/playlist/(.*)", PlaylistHandler),
    (r"/api/playlist", PlaylistRootHandler),
    (r"/api/station/search", StationSearchHandler),
    (r"/api/station/(.*)", StationHandler),
    (r"/api/station", StationRootHandler),
    (r"/api/rating", RatingHandler),
    (r"/api/suggestion/(.*)", SuggestionHandler),
]

