import json
from datetime import date

from tornado.web import RequestHandler

from . import Recording
from ..importer import DirectoryService
from ..util import BaseApiHandler

class RecordingRootHandler(BaseApiHandler):

    def get(self):

        try:
            summaries = self.db_query(Recording.get_summaries)
        except Exception as exc:
            self.application.logger.error("Could not get recording list", exc_info = True)

        sort_order = lambda r: (r.artist, r.recording_date if r.recording_date is not None else date(1900, 1, 1))
        self.write(json.dumps(sorted(summaries, key = sort_order), cls = self.JsonEncoder))

    def post(self):

        if self.json_body:
            results = self.db_query(Recording.search, self.json_body)
        else:
            self.logger.error(f"POST request {request.url}: expected json")

        self.write(json.dumps(results, cls = self.JsonEncoder))

class RecordingHandler(BaseApiHandler):

    def get(self, recording_id):

        try:
            recording = self.db_action(Recording.get, recording_id)
        except Exception as exc:
            self.logger.error(f"Could not get recording {recording_id}", exc_info = True)
        self.write(json.dumps(recording, cls = self.JsonEncoder))

    def put(self, recording_id, item = None):

        if self.json_body:
            try:
                if item is None:
                    self.db_action(Recording.update, self.json_body)
                elif item == "rating":
                    self.db_action(Recording.set_rating, recording_id, self.json_body)
            except:
                self.logger.error(f"PUT {request.url}: Expected json")

    def post(self, recording_id):

        if self.json_body:
            self.db_action(Recording.create, self.json_body)
            self.application.directory_service.add_directory_to_index(self.json_body["directory"])
        else:
            self.logger.error(f"POST {request.url}: Expected json")
        
