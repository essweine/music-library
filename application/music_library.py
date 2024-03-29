import sqlite3, os
import logging

from tornado.web import Application, StaticFileHandler

from .library import LIBRARY_HANDLERS, TABLES, VIEWS
from .importer import IMPORT_HANDLERS, DirectoryService
from .player import Player, PlayerDisplayHandler, PLAYER_HANDLERS
from .log import LogNotificationHandler

handlers = LIBRARY_HANDLERS + PLAYER_HANDLERS + IMPORT_HANDLERS + [ 
    (r"/api/log/notifications", LogNotificationHandler),
    (r"/static", StaticFileHandler),
    (r".*", PlayerDisplayHandler),
]

class MusicLibrary(Application):

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)
        self.root = None
        self.conn = None
        self.directory_service = None
        self.player = None
        self.logger = logging.getLogger("tornado.application")
        self.console = None

    def init_db(self, dbname):

        try:
            self.conn = sqlite3.connect(dbname, detect_types=sqlite3.PARSE_DECLTYPES)
            cursor = self.conn.cursor()
            for item in TABLES + VIEWS:
                item.initialize(cursor)
            self.conn.commit()
            cursor.close()
        except Exception as exc:
            self.logger.error("Could not initialize database", exc_info = True)

    def set_root_directory(self, root):

        if self.conn is None:
            self.logger.error("The database must be initialized before the directory list")

        self.root = os.path.abspath(root)
        try:
            self.player = Player(self.root)
        except Exception as exc:
            self.logger.error("An error occurred whie initializing the player", exc_info = True)
        self.add_handlers(r".*", [ (r"/file/(.*)", StaticFileHandler, { "path": self.root }) ])

        try:
            cursor = self.conn.cursor()
            cursor.execute("select directory from recording")
            indexed_directories = [ dirname for (dirname, ) in cursor.fetchall() ]
            cursor.close()
            self.directory_service = DirectoryService(root, indexed_directories)
        except Exception as exc:
            self.logger.error("An exception occured while creating the directory list", exc_info = True)

    def init_console(self, queue_handler):

        self.console = queue_handler

    def update_state(self):

        cursor = self.conn.cursor()
        self.player.check_state(cursor)
        cursor.close()

        while not self.console.queue.empty():
            try:
                message = self.console.queue.get()
                for ws in self.console.websockets:
                    ws.write_message(message)
            except:
                self.logger.error("An exception occurred while sending the log messages", exc_info = True)
                break

