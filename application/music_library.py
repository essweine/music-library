import sqlite3, os, re
from uuid import uuid4

from tornado.web import Application, StaticFileHandler, RequestHandler

from .config import TABLE_DEFS
from .importer import DirectoryListing, ImportHandler, ImportRootHandler, ImportDisplayHandler
from .library import RecordingHandler, RecordingRootHandler, RecordingDisplayHandler
from .player import Player, PlayerHandler, PlayerDisplayHandler

handlers = [ 
    (r"/importer", ImportRootHandler),
    (r"/importer/(.*)", ImportDisplayHandler),
    (r"/api/importer/(.*)/(.*?)", ImportHandler),
    (r"/api/importer/(.*)", ImportHandler),
    (r"/recording", RecordingRootHandler),
    (r"/recording/(.*?)", RecordingDisplayHandler),
    (r"/api/recording/(.*?)/(.*?)", RecordingHandler),
    (r"/api/recording/(.*?)", RecordingHandler),
    (r"/api/player", PlayerHandler),
    (r"/static", StaticFileHandler),
    (r"/", PlayerDisplayHandler),
]

class MusicLibrary(Application):

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)
        self.root = None
        self.conn = None
        self.unindexed_directory_list = { }
        self.player = None

    def init_db(self, dbname):

        try:
            self.conn = sqlite3.connect(dbname, detect_types=sqlite3.PARSE_DECLTYPES)
            cursor = self.conn.cursor()
            for stmt in TABLE_DEFS:
                cursor.execute(stmt)
            self.conn.commit()
            cursor.close()
        except:
            raise

    def set_root_directory(self, root):

        if self.conn is None:
            raise Exception("The database must be initialized before the directory list")

        self.root = os.path.abspath(root)
        self.player = Player(self.root)

        self.add_handlers(r".*", [ (r"/file/(.*)", StaticFileHandler, { "path": self.root }) ])

        try:
            cursor = self.conn.cursor()
            cursor.execute("select directory from recording")
            indexed_directories = [ dirname for (dirname, ) in cursor.fetchall() ]
            cursor.close()

            for dirpath, dirs, files in os.walk(self.root):
                relative_name = re.sub("^{0}/?".format(self.root), "", dirpath)
                if relative_name in indexed_directories:
                    dirs.clear()
                if DirectoryListing.contains_audio(files) and relative_name not in indexed_directories:
                    entry = DirectoryListing(relative_name, root)
                    self.unindexed_directory_list[entry.id] = entry
        except:
            raise

    def update_state(self):

        while self.player.conn.poll():
            try:
                cursor = self.conn.cursor()
                self.player.update_state(cursor, self.player.conn.recv())
                cursor.close()
                self.conn.commit()
            except:
                raise
