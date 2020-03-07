import json

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler

from ..util import BaseApiHandler

class PlayerDisplayHandler(RequestHandler):

    def get(self):

        self.render("player.html")

class PlayerHandler(BaseApiHandler):

    def get(self):

        state = self.db_action(self.application.player.state.add_track_info)
        self.write(json.dumps(state, cls = self.JsonEncoder))

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
