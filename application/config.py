AUDIO_FILETYPES = [ "flac", "shn" ]
TEXT_FILETYPES = [ "txt" ]
IMAGE_FILETYPES = [ "png", "jpeg", "jpg", "gif" ]

from .library.recording import RecordingTable, TrackTable, RecordingTrackView, LibraryTrackView
from .library.recording_summary import RecordingArtistView, RecordingSummaryView
from .library.property import PropertyTable
from .library.search import LibrarySearchView
from .library.station import StationTable

from .player.history import HistoryTable, HistoryTrackView
from .player.playlist_track import PlaylistTrackView

TABLES = [
    RecordingTable,
    TrackTable,
    PropertyTable,
    StationTable,
    HistoryTable,
]

VIEWS = [
    RecordingTrackView,
    LibraryTrackView,
    RecordingArtistView,
    RecordingSummaryView,
    LibrarySearchView,
    HistoryTrackView,
    PlaylistTrackView,
]
