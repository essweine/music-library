import json

from ..util import BaseApiHandler
from . import Search

class RecordingSearchHandler(BaseApiHandler):

    def get(self):

        config = self.db_action(Search.configuration, "recording")
        self.write(json.dumps(config, cls = self.JsonEncoder))

    def post(self):

        if self.json_body:
            results = self.db_query(Search.recording, self.json_body)
        else:
            self.logger.error(f"POST request {self.request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))

class StationSearchHandler(BaseApiHandler):

    def get(self):

        config = self.db_action(Search.configuration, "station")
        self.write(json.dumps(config, cls = self.JsonEncoder))

    def post(self):

        if self.json_body:
            results = self.db_query(Search.station, self.json_body)
        else:
            self.logger.error(f"POST request {self.request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))

class PropertyHandler(BaseApiHandler):

    def get(self, prop):

        result = self.db_action(Search.property_values, prop)
        self.write(json.dumps(result, cls = self.JsonEncoder))

