import os, re, json
from uuid import uuid4

from tornado.web import RequestHandler

from . import DirectoryListing

class ImportRootHandler(RequestHandler):

    def get(self):

        items = [ ]
        for entry in sorted(self.application.unindexed_directory_list.values(), key = lambda e: e.name):
            items.append({
                "title": entry.name,
                "description": "{0} files".format(len(entry.audio)),
                "buttons": [
                    { "id": "add", "item": entry.id, "text": "Add directory to library" },
                    { "id": "add-parent", "item": entry.id, "text": "Add parent directory to library" },
                ]
            })

        self.render("browse.html", page_title = "Unindexed Directory List", items = items)

class ImportDisplayHandler(RequestHandler):

    def get(self, directory_id):
        entry = self.application.unindexed_directory_list[directory_id]
        if self.get_argument("parent", None):
            parent = DirectoryListing(entry.parent, self.application.root)
            self.application.unindexed_directory_list[parent.id] = parent
            self.redirect("/importer/{0}".format(parent.id))
        else:
            recording = entry.as_recording(entry.text[0] if entry.text else None, False)
            recording["tracks"] = [ track for track in recording["tracks"] if track["filename"] is not None ]
            self.render("recording.html",
                context = "import",
                page_title = entry.name,
                recording = recording,
                images = " ".join([ 'file{0}="{1}"'.format(idx, fn) for idx, fn in enumerate(entry.images) ]),
                text = " ".join([ 'file{0}="{1}"'.format(idx, fn) for idx, fn in enumerate(entry.text) ]),
            )

class ImportHandler(RequestHandler):

    def get(self, directory_id):

        output_type = self.get_argument("as", None)
        source = self.get_argument("source", None)
        entry = self.application.unindexed_directory_list[directory_id]
        if output_type == "recording":
            if source is not None:
                self.write(entry.as_recording(source))
            elif entry.text:
                self.write(entry.as_recording(entry.text[0]))
            else:
                self.write(entry.as_recording())
        else:
            self.write(entry.as_json())


