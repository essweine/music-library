import os
import tempfile
from shutil import unpack_archive, rmtree
import stat

DIRNAME = os.path.dirname(__file__)
ROOT_PATH = os.path.join(DIRNAME, "data")
DEFAULT_INDEX = [ "text" ]
COMPLETE_INDEX = [ "root/Keep It Like A Secret", "root/Edge of the Sun" ]

DB_NAME = os.path.join(tempfile.gettempdir(), "music_library_test.db")

def setUpModule():
    unpack_archive(os.path.join(DIRNAME, "data.zip"), DIRNAME)
    mode = stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH
    os.chmod(os.path.join(DIRNAME, "data", "mock_play"), mode)

def tearDownModule():
    rmtree(ROOT_PATH)
