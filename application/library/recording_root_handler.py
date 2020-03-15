import os, re, json
from sqlite3 import Row
from datetime import date

from tornado.web import RequestHandler
from tornado.options import options

from . import Recording
from ..util import BaseApiHandler

class RecordingRootDisplayHandler(RequestHandler):

    def get(self):

        try:
            cursor = self.application.conn.cursor()
            summaries = Recording.get_summaries(cursor)
            cursor.close()
        except:
            raise

        sort_order = lambda r: (r.artist, r.recording_date if r.recording_date is not None else date(1900, 1, 1))
        self.render("browse-recordings.html", summaries = sorted(summaries, key = sort_order))

class RecordingRootHandler(BaseApiHandler):

    def get(self):
        pass

