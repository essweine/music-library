import os, re, json
from uuid import uuid4

from tornado.web import RequestHandler
from ..util import BaseRequestHandler, BaseApiHandler

from . import DirectoryService

class ImportRootDisplayHandler(BaseRequestHandler):

    def get(self):

        self.render("browse-directories.html")

class ImportDisplayHandler(BaseRequestHandler):

    def get(self, dirname):

        self.render("recording.html", script = "import.js")

class ImportRootHandler(BaseApiHandler):

    def get(self):

        response = self.application.directory_service.list_all()
        self.write(json.dumps(response, cls = self.JsonEncoder))

class ImportHandler(BaseApiHandler):

    def get(self, dirname):

        directory = self.application.directory_service.get_directory(dirname)
        if len(directory.children):
            self.application.directory_service.aggregate(directory)
        parsed_text = [ self.application.directory_service.create_recording(directory, f) for f in directory.text ] 
        parsed_text.append(self.application.directory_service.create_recording(directory))
        response = directory.as_dict()
        response.update({ "parsed_text": parsed_text })
        self.write(json.dumps(response, cls = self.JsonEncoder))

    def post(self, dirname):

        if self.json_body:
            directory = self.application.directory_service.search(dirname)
            if len(directory.children):
                self.application.directory_service.aggregate(directory)
            recording = self.application.directory_service.create_recording(directory, self.json_body)
            self.write(json.dumps(recording, cls = self.JsonEncoder))
        else:
            self.logger.error(f"POST {request.url}: Expected json")

