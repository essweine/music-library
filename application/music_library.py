import sqlite3, os, re
from uuid import uuid4

from tornado.web import Application, StaticFileHandler, RequestHandler

from .config import RECORDING_TABLE_DEFINITION, TRACK_TABLE_DEFINITION
from .importer import DirectoryListing, ImportHandler, ImportRootHandler, ImportDisplayHandler
from .library import RecordingHandler, RecordingDisplayHandler
from .player import Player

handlers = [ 
    (r"/importer", ImportRootHandler),
    (r"/importer/(.*)", ImportDisplayHandler),
    (r"/api/importer/(.*)", ImportHandler),
    (r"/recording/(.*?)", RecordingDisplayHandler),
    (r"/api/recording/(.*?)", RecordingHandler),
    (r"/static", StaticFileHandler),
]

class MusicLibrary(Application):

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)
        self.conn = None
        self.root = None
        self.unindexed_directory_list = { }
        self.player = Player()

    def init_db(self, dbname):

        try:
            self.conn = sqlite3.connect(dbname, detect_types=sqlite3.PARSE_DECLTYPES)
            cursor = self.conn.cursor()
            cursor.execute(RECORDING_TABLE_DEFINITION)
            cursor.execute(TRACK_TABLE_DEFINITION)
            self.conn.commit()
            cursor.close()
        except:
            raise

    def init_unindexed_directory_list(self, root):

        if self.conn is None:
            raise Exception("The database must be initialized before the directory list")

        self.root = root
        self.add_handlers(r".*", [ (r"/file/(.*)", StaticFileHandler, { "path": os.path.abspath(root) }) ])

        try:
            cursor = self.conn.cursor()
            cursor.execute("select directory from recording")
            indexed_directories = [ dirname for (dirname, ) in cursor.fetchall() ]
            cursor.close()

            for dirpath, dirs, files in os.walk(root):
                relative_name = re.sub("^{0}/?".format(self.root), "", dirpath)
                if DirectoryListing.contains_audio(files) and relative_name not in indexed_directories:
                    entry = DirectoryListing(relative_name, root)
                    self.unindexed_directory_list[entry.id] = entry
        except:
            raise

    def update_state(self):

        while self.player.conn.poll():
            self.player.update_state(*self.player.conn.recv())

