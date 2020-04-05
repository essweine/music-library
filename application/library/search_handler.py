import json

from ..util import BaseApiHandler
from . import PlaylistTrack

class SearchHandler(BaseApiHandler):

    def post(self):

        if self.json_body:
            results = self.db_query(PlaylistTrack.search, self.json_body)
        else:
            self.logger.error(f"POST request {request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))
