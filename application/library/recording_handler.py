import os, re, json

from tornado.web import RequestHandler
from tornado.options import options

from . import Recording

class RecordingHandler(RequestHandler):

    def prepare(self):

        if "application/json" in self.request.headers.get("Content-Type", ""):
            self.json_body = json.loads(self.request.body)
        else:
            self.json_body = None

    def get(self, recording_id):

        self.render("recording.html")

    def post(self, recording_id):

        pass

    def put(self, recording_id):

        directory =  self.json_body.get("directory", None)
        entry = self.application.unindexed_directory_list.pop(directory)
        if self.json_body:
            try:
                cursor = self.application.conn.cursor()
                Recording.create(cursor, id = recording_id, **self.json_body)
                self.application.conn.commit()
            except:
                raise
            finally:
                cursor.close()

        for subdir in entry.children:
            try:
                del self.application.unindexed_directory_list[subdir]
            except:
                pass

