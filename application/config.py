AUDIO_FILETYPES = [ "flac", "shn" ]
TEXT_FILETYPES = [ "txt" ]
IMAGE_FILETYPES = [ "png", "jpeg", "jpg", "gif" ]

from .library.recording import RecordingTable, TrackTable, RecordingTrackView, LibraryTrackView
from .library.recording_summary import RecordingArtistView, RecordingSummaryView
from .library.property import PropertyTable
from .library.search import LibrarySearchView
from .library.station import StationTable
from .library.playlist import PlaylistTable, PlaylistEntryTable, PlaylistTrackView

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
