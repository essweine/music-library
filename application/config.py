AUDIO_FILETYPES = [ "flac", "shn", "mp2" ]
TEXT_FILETYPES = [ "txt" ]
IMAGE_FILETYPES = [ "png", "jpeg", "jpg", "gif" ]

from .library.recording import RecordingTable, TrackTable, LibraryTrackView
from .library.search import RecordingArtistView, RecordingSummaryView, RecordingTrackView, LibrarySearchView, PlaylistTrackView
from .library.property import PropertyTable
from .library.station import StationTable
from .library.playlist import PlaylistTable, PlaylistEntryTable

from .player.history import HistoryTable, HistoryTrackView

TABLES = [
    RecordingTable,
    TrackTable,
    PropertyTable,
    StationTable,
    HistoryTable,
    PlaylistTable,
    PlaylistEntryTable,
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
