import sys
import json

from . import Recording, RecordingSummary, Search
from ..importer import DirectoryService
from ..util import BaseApiHandler

class RecordingRootHandler(BaseApiHandler):

    def get(self):

        try:
            summaries = self.db_query(RecordingSummary.get_all)
            self.write(json.dumps(summaries, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not get recording list", exc_info = sys.exc_info())

    def post(self):

        if self.json_body:
            results = self.db_query(Search.recording, self.json_body)
            self.write(json.dumps(results, cls = self.JsonEncoder))
        else:
            self.write_error(400, messsages = [ "Expected json" ])

class RecordingHandler(BaseApiHandler):

    def get(self, recording_id):

        try:
            recording = self.db_action(Recording.get, recording_id)
            if recording is not None:
                self.write(json.dumps(recording, cls = self.JsonEncoder))
            else:
                self.write_error(404, messages = [ f"Recording not found: {recording_id}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get recording {recording_id}", exc_info = sys.exc_info())

    def put(self, recording_id):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            errors = Recording.validate(self.json_body)
            if errors:
                self.write_error(400, messages = errors)
            self.db_action(Recording.update, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not update recording {recording_id}", exc_info = sys.exc_info())

    def post(self, recording_id):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            errors = Recording.validate(self.json_body)
            if errors:
                self.write_error(400, messages = errors)
            self.db_action(Recording.create, self.json_body)
            self.application.directory_service.add_directory_to_index(self.json_body["directory"])
        except:
            self.write_error(500, log_message = f"Could not create recording {recording_id}", exc_info = sys.exc_info())

