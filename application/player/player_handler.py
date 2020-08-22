import json
import sys

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler
from tornado import log as logger

from ..util import BaseApiHandler
from ..library import PlaylistTrack

class PlayerDisplayHandler(RequestHandler):

    def get(self):

        self.render("player.html", script = "player.js")

class PlayerHandler(BaseApiHandler):

    def get(self):

        try:
            self.write(json.dumps(self._get_state(), cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = "Could not get current state", exc_info = sys.exc_info())

    def post(self):

        if self.json_body is None:
            self.write_error(400, messages = [ "Expected json" ])

        try:
            for task in self.json_body["tasks"]:
                self.application.player.send_task(**task)
        except:
            self.write_error(500, log_message = "Could not get update the current state", exc_info = sys.exc_info())

    def _get_state(self):

        state = self.application.player.state
        filenames = [ entry.filename for entry in state.playlist ]
        tracks = self.db_query(PlaylistTrack.from_filenames, filenames)
        state.playlist = sorted(tracks, key = lambda t: filenames.index(t.filename))
        return state

class PlayerNotificationHandler(WebSocketHandler):

    def open(self):
        self.application.player.websockets.add(self)
        self.write_message("open");

    def on_close(self):
        self.application.player.websockets.remove(self)

    def on_message(self, message):
        pass

