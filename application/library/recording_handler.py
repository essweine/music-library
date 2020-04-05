import json

from tornado.web import RequestHandler

from . import Recording
from ..importer import DirectoryListing
from ..util import BaseRequestHandler, BaseApiHandler

class RecordingDisplayHandler(BaseRequestHandler):

    def get(self, recording_id):

        try:
            recording = self.db_action(Recording.get, recording_id)
        except Exception as exc:
            self.application.logger.error(f"Could not get recording {recording_id}", exc_info = True)

        self.render("recording.html",
            context = "display",
            page_title = recording.title,
            recording = recording,
            images = 'file="{0}"'.format(recording.artwork) if recording.artwork else "",
            text = 'file="{0}"'.format(recording.notes) if recording.notes else "",
        )

class RecordingHandler(BaseApiHandler):

    def get(self, recording_id, item = None):

        try:
            recording = self.db_action(Recording.get, recording_id)
        except Exception as exc:
            self.logger.error(f"Could not get recording {recording_id}", exc_info = True)

        if item == "entry":
            entry = DirectoryListing(recording.directory, self.application.root)
            entry.id = recording_id
            response = entry
        elif item == "notes":
            entry = DirectoryListing(recording.directory, self.application.root)
            entry.id = recording_id
            response = entry.as_recording(recording.notes)
        else:
            response = recording

        self.write(json.dumps(response, cls = self.JsonEncoder))

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

        entry = self.application.unindexed_directory_list.pop(recording_id)
        if self.json_body:
            try:
                self.db_action(Recording.create, self.json_body)
            except:
                self.logger.error(f"POST {request.url}: Expected json")

        if entry.children:
            to_remove = [ ]
            for directory in self.application.unindexed_directory_list.values():
                if directory.name in entry.children:
                    to_remove.append(directory.id)

            for item in to_remove:
                try:
                    del self.application.unindexed_directory_list[item]
                except:
                    pass

