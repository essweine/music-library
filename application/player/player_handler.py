import json

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler

from ..util import BaseApiHandler
from .playlist_track import PlaylistTrack

class PlayerDisplayHandler(RequestHandler):

    def get(self):

        self.render("player.html")

class PlayerHandler(BaseApiHandler):

    def get(self):

        cursor = self.application.conn.cursor()
        state = self.application.player.state
        self.write(
            json.dumps(
                {
                    "current": PlaylistTrack.from_filename(cursor, state.current.filename) if state.current else None,
                    "next_entries": PlaylistTrack.from_filenames(cursor, [ e.filename for e in state.next_entries ]),
                    "recently_played": PlaylistTrack.from_filenames(cursor, [ e.filename for e in state.recently_played ]),
                },
                cls = self.JsonEncoder
            )
        )

    def post(self):

        if self.json_body:
            for task in self.json_body["tasks"]:
                self.application.player.send_task(**task)
        else:
            raise Exception("Expected json")

class PlayerNotificationHandler(WebSocketHandler):

    def on_message(self):

        pass

    def write_message(self):

        pass
