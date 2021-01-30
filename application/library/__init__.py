# DB Interface
from .recording import PropertyTable, TrackTable, RecordingTable, RecordingPropertyView, TrackPropertyView
from .recording import LibraryTrackView, RecordingTrackView, LibrarySearchView, RecordingSummaryView, PlaylistTrackView
from .playlist import PlaylistTable, PlaylistEntryTable
from .station import StationTable
from .podcast import PodcastTable, PodcastEpisodeTable, PodcastSearchView, PodcastSummaryView
from .history import HistoryTable, HistoryTrackView

TABLES = [
    PropertyTable,
    TrackTable,
    RecordingTable,
    PlaylistTable,
    PlaylistEntryTable,
    StationTable,
    PodcastTable,
    PodcastEpisodeTable,
    HistoryTable,
]

VIEWS = [
    RecordingPropertyView,
    TrackPropertyView,
    LibraryTrackView,
    RecordingTrackView,
    LibrarySearchView,
    RecordingSummaryView,
    PlaylistTrackView,
    HistoryTrackView,
    PodcastSearchView,
    PodcastSummaryView,
]

# Handlers
from .recording_handler import RecordingHandler, RecordingRootHandler, RecordingTrackHandler, RecordingTagHandler
from .recording_handler import RecordingSearchHandler, RecordingAggregationHandler
from .track_handler import TrackSearchHandler, TrackAggregationHandler
from .playlist_handler import PlaylistHandler, PlaylistRootHandler, PlaylistSearchHandler, PlaylistTrackHandler
from .station_handler import StationHandler, StationRootHandler, StationSearchHandler
from .podcast_handler import PodcastRootHandler, PodcastSearchHandler, PodcastHandler
from .podcast_handler import PodcastEpisodeRootHandler, PodcastEpisodeHandler
from .rating_handler import RatingHandler
from .suggestion_handler import SuggestionHandler
from .history_handler import RecentlyPlayedHandler, FrequentlyPlayedHandler, TrackHistoryHandler

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
    (r"/api/podcast/search", PodcastSearchHandler),
    (r"/api/podcast/(.*)/episodes/(.*)", PodcastEpisodeHandler),
    (r"/api/podcast/(.*)/episodes", PodcastEpisodeRootHandler),
    (r"/api/podcast/(.*)", PodcastHandler),
    (r"/api/podcast", PodcastRootHandler),
    (r"/api/rating", RatingHandler),
    (r"/api/suggestion/(.*)", SuggestionHandler),
    (r"/api/history/recent", RecentlyPlayedHandler),
    (r"/api/history/frequent", FrequentlyPlayedHandler),
    (r"/api/history/track", TrackHistoryHandler),
]

