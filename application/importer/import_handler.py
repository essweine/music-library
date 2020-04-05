import os, re, json
from uuid import uuid4

from tornado.web import RequestHandler
from ..util import BaseRequestHandler, BaseApiHandler

from . import DirectoryListing

class ImportRootHandler(BaseRequestHandler):

    def get(self):

        entries = sorted(self.application.unindexed_directory_list.values(), key = lambda e: e.name)
        self.render("browse-directories.html", entries = entries)

class ImportDisplayHandler(BaseRequestHandler):

    def get(self, directory_id):
        entry = self.application.unindexed_directory_list[directory_id]
        if self.get_argument("parent", None):
            parent = DirectoryListing(entry.parent, self.application.root)
            self.application.unindexed_directory_list[parent.id] = parent
            self.redirect("/importer/{0}".format(parent.id))
        else:
            recording = entry.as_recording(entry.text[0] if entry.text else None)
            recording.tracks = [ track for track in recording.tracks if track.filename is not None ]
            self.render("recording.html",
                context = "import",
                page_title = entry.name,
                recording = recording,
                images = " ".join([ 'file{0}="{1}"'.format(idx, fn) for idx, fn in enumerate(entry.images) ]),
                text = " ".join([ 'file{0}="{1}"'.format(idx, fn) for idx, fn in enumerate(entry.text) ]),
            )

class ImportHandler(BaseApiHandler):

    def get(self, directory_id):

        output_type = self.get_argument("as", None)
        source = self.get_argument("source", None)
        entry = self.application.unindexed_directory_list[directory_id]
        if output_type == "recording":
            if source is not None:
                response = entry.as_recording(source)
            elif entry.text:
                response = entry.as_recording(entry.text[0])
            else:
                response = entry.as_recording()
        else:
           response = entry

        self.write(json.dumps(response, cls = self.JsonEncoder, indent = 2, separators = [ ", ", ": " ]))

