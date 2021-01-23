import sys
import json

from .recording import RecordingSummaryView, LibrarySearchView
from ..util import BaseApiHandler, BaseSearchHandler

class RecordingRootHandler(BaseApiHandler):

    def get(self):

        try:
            summaries = self.db_query(RecordingSummaryView.get_all)
            self.write(json.dumps(summaries, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not get recording list", exc_info = sys.exc_info())

    def post(self):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            errors = LibrarySearchView.validate(self.json_body)
            if errors:
                self.write_error(400, messages = errors)
            recording_id = self.db_action(LibrarySearchView.create_recording, self.json_body)
            self.write(json.dumps({ "id": recording_id }))
            self.application.directory_service.add_directory_to_index(self.json_body["directory"])
        except:
            self.write_error(500, log_message = f"Could not create recording", exc_info = sys.exc_info())

class RecordingSearchHandler(BaseSearchHandler):

    SearchType = "recording"

    def get_configuration(self):
        return self.db_action(RecordingSummaryView.search_configuration)

    def search(self):
        return self.db_query(RecordingSummaryView.search, self.json_body)

class RecordingAggregationHandler(BaseApiHandler):

    def post(self, agg_type):

        if not self.json_body:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            results = self.db_query(RecordingSummaryView.aggregate, agg_type, self.json_body)
            self.write(json.dumps(results, cls = self.JsonEncoder))
        except ValueError as exc:
            self.write_error(400, messages = [ str(exc) ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not execute recording query", exc_info = sys.exc_info())

class RecordingHandler(BaseApiHandler):

    def get(self, recording_id):

        try:
            recording = self.db_action(LibrarySearchView.get_recording, recording_id)
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
            errors = LibrarySearchView.validate(self.json_body)
            if errors:
                self.write_error(400, messages = errors)
            self.db_action(LibrarySearchView.update_recording, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not update recording {recording_id}", exc_info = sys.exc_info())

class RecordingTrackHandler(BaseApiHandler):

    def get(self, recording_id):

        try:
            tracks = self.db_query(LibrarySearchView.get_tracks, recording_id)
            self.write(json.dumps(tracks, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = f"Could not retrieve tracks for {recording_id}", exc_info = sys.exc_info())

class RecordingTagHandler(BaseApiHandler):

    def post(self, recording_id):

        try:
            recording = self.db_action(LibrarySearchView.get_recording, recording_id)
            errors = self.application.directory_service.write_tags(recording)
            if errors:
                self.write_error(400, messages = errors)
        except:
            self.write_error(500, log_message = f"Could not write tags", exc_info = sys.exc_info())

