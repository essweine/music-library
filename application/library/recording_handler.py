import os, re, json

from tornado.web import RequestHandler
from tornado.options import options

from . import Recording
from .db import create_recording

class RecordingHandler(RequestHandler):

    def prepare(self):

        if "application/json" in self.request.headers.get("Content-Type", ""):
            self.json_body = json.loads(self.request.body)
        else:
            self.json_body = None

    def get(self, recording_id):

        cursor = self.application.conn.cursor()
        recording = Recording(cursor, recording_id)
        cursor.close()
        self.render("recording.html", recording = recording)

    def post(self, recording_id):

        pass

    def put(self, recording_id):

        entry = self.application.unindexed_directory_list.pop(recording_id)
        if self.json_body:
            try:
                cursor = self.application.conn.cursor()
                create_recording(cursor, id = recording_id, **self.json_body)
                self.application.conn.commit()
            except:
                raise
            finally:
                cursor.close()

        to_remove = [ ]
        for directory in self.application.unindexed_directory_list.values():
            if directory.name in entry.children:
                to_remove.append(directory.id)

        for item in to_remove:
            try:
                del self.application.unindexed_directory_list[item]
            except:
                pass

