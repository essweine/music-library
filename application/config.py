AUDIO_FILETYPES = [ "flac" ]
TEXT_FILETYPES = [ "txt" ]
IMAGE_FILETYPES = [ "png", "jpeg", "jpg" ]

from .library.recording import RECORDING_COLUMNS, TRACK_COLUMNS
from .player.history import HISTORY_COLUMNS
from .db import table_definition

TABLE_DEFS = [
    table_definition("recording", RECORDING_COLUMNS),
    table_definition("track", TRACK_COLUMNS),
    table_definition("history", HISTORY_COLUMNS),
]

