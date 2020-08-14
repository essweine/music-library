import os
import tempfile

ROOT_PATH = os.path.join(os.path.dirname(__file__), "data")
DEFAULT_INDEX = [ "text" ]
COMPLETE_INDEX = [ "root/Keep It Like A Secret", "root/Edge of the Sun" ]

DB_NAME = os.path.join(tempfile.gettempdir(), "music_library_test.db")
