import json

from ..util import BaseApiHandler
from . import Recording, Station

class RecordingSearchHandler(BaseApiHandler):

    def post(self):

        if self.json_body:
            results = self.db_query(Recording.search, self.json_body)
        else:
            self.logger.error(f"POST request {self.request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))

class StationSearchHandler(BaseApiHandler):

    def post(self):

        if self.json_body:
            results = self.db_query(Station.search, self.json_body)
        else:
            self.logger.error(f"POST request {self.request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))

