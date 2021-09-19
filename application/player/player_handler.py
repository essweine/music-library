import json
import sys

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler
from tornado import log as logger

from .state import Task
from ..util import BaseApiHandler

class PlayerDisplayHandler(RequestHandler):

    def get(self):

        self.render("player.html", script = "player.js")

class PlayerHandler(BaseApiHandler):

    def get(self):

        try:
            state = self.db_action(self.application.player.get_state)
            self.write(json.dumps(state, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = "Could not get current state", exc_info = sys.exc_info())

    def post(self):

        if self.json_body is None:
            self.write_error(400, messages = [ "Expected json" ])

        try:
            task = Task(**self.json_body)
            self.application.player.execute(task)
        except:
            self.write_error(500, log_message = "Could not update the current state", exc_info = sys.exc_info())

class PlayerNotificationHandler(WebSocketHandler):

    def open(self):
        self.application.player.websockets.add(self)
        self.write_message("open");

    def on_close(self):
        self.application.player.websockets.remove(self)

    def on_message(self, message):
        pass

