import json

from tornado.web import RequestHandler
from ..util import BaseApiHandler

class PlayerDisplayHandler(RequestHandler):

    def get(self):

        self.render("player.html")

class PlayerHandler(BaseApiHandler):

    def get(self):

        self.write(json.dumps(self.application.player.state, cls = self.JsonEncoder))

    def post(self):

        if self.json_body:
            for task in self.json_body["tasks"]:
                self.application.player.send_task(**task)
        else:
            raise Exception("Expected json")
