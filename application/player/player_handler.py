import json

from tornado.web import RequestHandler
from ..util import BaseApiHandler

class PlayerHandler(BaseApiHandler):

    def get(self):

        return self.application.player.state.as_json()

    def post(self):

        if self.json_body:
            for task in self.json_body["tasks"]:
                self.application.player.send_task(**task)
        else:
            raise Exception("Expected json")
