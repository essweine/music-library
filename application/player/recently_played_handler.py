import json
import sys
from datetime import datetime

from tornado.web import RequestHandler
from tornado import log as logger

from ..util import BaseApiHandler
from .history import History

class RecentlyPlayedHandler(BaseApiHandler):

    def post(self):

        if self.json_body:
            results = self.db_action(History.tracks_from_period, **self.json_body)
        else:
            self.logger.error(f"POST request {request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))
