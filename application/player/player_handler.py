import json
import sys

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler
from tornado import log as logger

from ..util import BaseApiHandler
from ..library import StationTable, PodcastSearchView, PlaylistTrackView

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
                self.application.player.send_task(task)
        except:
            self.write_error(500, log_message = "Could not update the current state", exc_info = sys.exc_info())

    def _get_state(self):

        state = self.application.player.state
        filenames = [ entry.filename for entry in state.playlist ]
        if state.stream:
            state.stream.station = self.db_action(StationTable.from_url, state.stream.url)
            state.stream.podcast = self.db_action(PodcastSearchView.from_url, state.stream.url)
        if state.preview is None:
            state.playlist = self.db_action(PlaylistTrackView.from_filenames, filenames)
        else:
            state.playlist = [ PlaylistTrackView.create_item(filename = filename, title = filename) for filename in filenames ]
        return state

class PlayerNotificationHandler(WebSocketHandler):

    def open(self):
        self.application.player.websockets.add(self)
        self.write_message("open");

    def on_close(self):
        self.application.player.websockets.remove(self)

    def on_message(self, message):
        pass

