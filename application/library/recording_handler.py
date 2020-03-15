import os, re, json
from sqlite3 import Row

from tornado.web import RequestHandler
from tornado.options import options

from . import Recording
from ..importer import DirectoryListing
from ..util import BaseApiHandler

class RecordingDisplayHandler(RequestHandler):

    def get(self, recording_id):

        try:
            cursor = self.application.conn.cursor()
            recording = Recording.get(cursor, recording_id)
            cursor.close()
        except:
            raise

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
        except:
            raise

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
                raise

    def post(self, recording_id):

        entry = self.application.unindexed_directory_list.pop(recording_id)
        if self.json_body:
            try:
                self.db_action(Recording.create, self.json_body)
            except:
                raise

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

