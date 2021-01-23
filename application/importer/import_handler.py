import os, re, json
import sys
from uuid import uuid4

from ..util import BaseApiHandler
from . import DirectoryService

class ImportRootHandler(BaseApiHandler):

    def get(self):

        try:
            response = self.application.directory_service.list_all()
            self.write(json.dumps(response, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = "Could not get unindexed directory list", exc_info = sys.exc_info())

    def post(self):

        try:
            self.application.directory_service.index()
        except:
            self.write_error(500, log_message = "Could not get reindex directory list", exc_info = sys.exc_info())

class ImportHandler(BaseApiHandler):

    def get(self, dirname):

        try:
            directory = self.application.directory_service.get_directory(dirname)
            if len(directory.children):
                self.application.directory_service.aggregate(directory)
            parsed_text = [ self.application.directory_service.create_recording(directory, f) for f in directory.text ] 
            parsed_text.append(self.application.directory_service.create_recording(directory))
            response = directory.serialize()
            response.update({ "parsed_text": parsed_text })
            self.write(json.dumps(response, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = f"Could not create recording for {dirname}", exc_info = sys.exc_info())

    def post(self, dirname):

        if self.json_body is None:
            self.write_error(400, messages = [ "Expected json" ])

        try:
            directory = self.application.directory_service.search(dirname)
            if len(directory.children):
                self.application.directory_service.aggregate(directory)
            recording = self.application.directory_service.create_recording(directory, self.json_body)
            self.write(json.dumps(recording, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = f"Could not get info for {dirname}", exc_info = sys.exc_info())

