import os, re, json
from sqlite3 import Row

from tornado.web import RequestHandler
from tornado.options import options

from . import Recording
from ..importer import DirectoryListing
from ..util import BaseApiHandler

class RecordingRootHandler(RequestHandler):

    def get(self):

        try:
            cursor = self.application.conn.cursor()
            cursor.row_factory = Row
            cursor.execute("select id, title, artist from recording")
        except:
            raise

        items = [ ]
        for row in cursor:
            items.append({
                "title": row["title"],
                "description": row["artist"],
                "buttons": [
                    { "id": "view-recording", "item": row["id"], "text": "View recording" },
                    { "id": "play-recording", "item": row["id"], "text": "Play recording" },
                ]
            })

        self.render("browse.html", page_title = "Recordings", items = items)

class RecordingDisplayHandler(RequestHandler):

    def get(self, recording_id):

        try:
            cursor = self.application.conn.cursor()
            recording = Recording(cursor, recording_id)
            cursor.close()
        except:
            raise

        self.render("recording.html",
            context = "display",
            page_title = recording.title,
            recording = recording.as_dict(),
            images = 'file="{0}"'.format(recording.artwork) if recording.artwork else "",
            text = 'file="{0}"'.format(recording.notes) if recording.notes else "",
        )

class RecordingHandler(BaseApiHandler):

    def get(self, recording_id, item = None):

        try:
            cursor = self.application.conn.cursor()
            recording = Recording(cursor, recording_id)
            cursor.close()
        except:
            raise

        if item == "entry":
            entry = DirectoryListing(recording.directory, self.application.root)
            entry.id = recording_id
            self.write(entry.as_json())
        elif item == "notes":
            entry = DirectoryListing(recording.directory, self.application.root)
            entry.id = recording_id
            self.write(entry.as_recording(recording.notes, as_json = True))
        else:
            self.write(recording.as_json())

    def put(self, recording_id, item = None):

        if self.json_body:
            try:
                cursor = self.application.conn.cursor()
                if item is None:
                    Recording.update_recording(cursor, **self.json_body)
                elif item == "rating":
                    Recording.update_rating(cursor, recording_id, self.json_body)
                cursor.close()
                self.application.conn.commit()
            except:
                raise

    def post(self, recording_id):

        entry = self.application.unindexed_directory_list.pop(recording_id)
        if self.json_body:
            try:
                cursor = self.application.conn.cursor()
                Recording.create_recording(cursor, **self.json_body)
                self.application.conn.commit()
            except:
                raise
            finally:
                cursor.close()

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

