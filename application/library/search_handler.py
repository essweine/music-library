import json

from ..util import BaseApiHandler
from . import Search

class RecordingSearchHandler(BaseApiHandler):

    def post(self):

        if self.json_body:
            results = self.db_query(Search.recording, self.json_body)
        else:
            self.logger.error(f"POST request {self.request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))

class StationSearchHandler(BaseApiHandler):

    def post(self):

        if self.json_body:
            results = self.db_query(Search.station, self.json_body)
        else:
            self.logger.error(f"POST request {self.request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))

