import sys
import json

from .recording import PlaylistTrackView
from ..util import BaseApiHandler, BaseSearchHandler

class TrackSearchHandler(BaseSearchHandler):

    SearchType = "track"

    def get_configuration(self):
        return self.db_action(PlaylistTrackView.search_configuration)

    def search(self):
        return self.db_query(PlaylistTrackView.search, self.json_body)

class TrackAggregationHandler(BaseApiHandler):

    def post(self, agg_type):

        if not self.json_body:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            results = self.db_query(PlaylistTrackView.aggregate, agg_type, self.json_body)
            self.write(json.dumps(results, cls = self.JsonEncoder))
        except ValueError as exc:
            self.write_error(400, messages = [ str(exc) ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not execute track query", exc_info = sys.exc_info())

