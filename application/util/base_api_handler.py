import json
from tornado.web import RequestHandler

from .json_encoder import JsonEncoder

class BaseApiHandler(RequestHandler):

    def initialize(self):

        self.JsonEncoder = JsonEncoder

    def prepare(self):

        if "application/json" in self.request.headers.get("Content-Type", ""):
            self.json_body = json.loads(self.request.body)
        else:
            self.json_body = None

    def set_default_headers(self):

        self.set_header("Content-Type", "application/json")
