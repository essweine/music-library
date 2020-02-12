import json

from tornado.web import RequestHandler

class PlayerHandler(RequestHandler):

    def prepare(self):

        if "application/json" in self.request.headers.get("Content-Type", ""):
            self.json_body = json.loads(self.request.body)
        else:
            self.json_body = None

    def get(self):

        return self.application.player.state.as_json()

    def post(self):

        if self.json_body:
            for task in self.json_body["tasks"]:
                self.application.player.send_task(**task)
        else:
            raise Exception("Expected json")
