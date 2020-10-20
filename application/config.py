AUDIO_FILETYPES = [ "flac", "shn" ]
TEXT_FILETYPES = [ "txt" ]
IMAGE_FILETYPES = [ "png", "jpeg", "jpg", "gif" ]

from .library import TABLES as library_tables, VIEWS as library_views
from .player import TABLES as history_tables, VIEWS as history_views
TABLES = library_tables + history_tables
VIEWS = library_views + history_views
