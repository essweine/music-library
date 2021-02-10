import json
import sys

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler
from tornado import log as logger

from ..util import BaseApiHandler
from ..library import PlaylistTrackView, StationTable, PodcastSearchView

class PlayerDisplayHandler(RequestHandler):

    def get(self):

        self.render("player.html", script = "player.js")

class PlayerHandler(BaseApiHandler):

    def get(self):

        try:
            self.write(json.dumps(self.application.player.state, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = "Could not get current state", exc_info = sys.exc_info())

    def post(self):

        if self.json_body is None:
            self.write_error(400, messages = [ "Expected json" ])

        try:
            for task in self.json_body["tasks"]:
                if task["name"] in [ "add", "stream", "podcast" ]:
                    task["info"] = self._get_task_info(task).serialize()
                self.application.player.send_task(task)
        except:
            self.write_error(500, log_message = "Could not update the current state", exc_info = sys.exc_info())

    def _get_task_info(self, task):

        if task["name"] == "add":
            return self.db_action(PlaylistTrackView.get, task["filename"])
        elif task["name"] == "stream":
            return self.db_action(StationTable.from_url, task["url"])
        elif task["name"] == "podcast":
            return self.db_action(PodcastSearchView.from_url, task["url"])

class PlayerNotificationHandler(WebSocketHandler):

    def open(self):
        self.application.player.websockets.add(self)
        self.write_message("open");

    def on_close(self):
        self.application.player.websockets.remove(self)

    def on_message(self, message):
        pass

