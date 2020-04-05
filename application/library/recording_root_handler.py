import json
from datetime import date

from . import Recording
from ..util import BaseRequestHandler, BaseApiHandler

class RecordingRootDisplayHandler(BaseRequestHandler):

    def get(self):

        try:
            summaries = self.db_query(Recording.get_summaries)
        except Exception as exc:
            self.application.logger.error("Could not get recording list", exc_info = True)

        sort_order = lambda r: (r.artist, r.recording_date if r.recording_date is not None else date(1900, 1, 1))
        self.render("browse-recordings.html", summaries = sorted(summaries, key = sort_order))

class RecordingRootHandler(BaseApiHandler):

    def post(self):

        if self.json_body:
            results = self.db_query(Recording.search, self.json_body)
        else:
            self.logger.error(f"POST request {request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))