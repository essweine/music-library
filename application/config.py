AUDIO_FILETYPES = [ "flac" ]
TEXT_FILETYPES = [ "txt" ]
IMAGE_FILETYPES = [ "png", "jpeg", "jpg" ]

from .library import RECORDING_COLUMNS, TRACK_COLUMNS
from .library.db import table_definition

RECORDING_TABLE_DEFINITION = table_definition("recording", RECORDING_COLUMNS)
TRACK_TABLE_DEFINITION = table_definition("track", TRACK_COLUMNS)
