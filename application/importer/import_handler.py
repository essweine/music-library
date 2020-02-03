import os, re, json
from uuid import uuid4

from tornado.web import RequestHandler
from dateutil.parser import parse as parsedate

from . import DirectoryListing

class ImportRootHandler(RequestHandler):

    def get(self):

        self.render("directory_list.html", 
            directory_list = sorted(self.application.unindexed_directory_list.values(), key = lambda e: e.name)
        )

class ImportHandler(RequestHandler):

    def get(self, directory_id):
        entry = self.application.unindexed_directory_list[directory_id]
        if self.get_argument("parent", None):
            parent = DirectoryListing(entry.parent, self.application.root)
            self.application.unindexed_directory_list[parent.id] = parent
            self.render("import.html", entry = parent)
        else:
            self.render("import.html", entry = entry)

    def post(self, directory_id):

        filename = self.get_argument("filename", None)
        entry = self.application.unindexed_directory_list[directory_id]
        self.write(json.dumps(entry.parse_text_file(filename)))

