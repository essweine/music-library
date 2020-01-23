import os, re, json
from uuid import uuid4

from tornado.web import RequestHandler
from dateutil.parser import parse as parsedate

from . import DirectoryListing

class ImportHandler(RequestHandler):

    def get(self):

        directory = self.get_argument("directory", None)
        if directory is None:
            self.render("directory_list.html", 
                directory_list = sorted(self.application.unindexed_directory_list.values(), key = lambda e: e.name)
            )
        else:
            entry = DirectoryListing(directory, self.application.root)
            self.application.unindexed_directory_list[directory] = entry
            self.render("import.html", entry = entry)

    def post(self):

        directory = self.get_argument("directory", None)
        filename = self.get_argument("filename", None)
        entry = self.application.unindexed_directory_list[directory]
        self.write(json.dumps(entry.parse_text_file(filename)))

