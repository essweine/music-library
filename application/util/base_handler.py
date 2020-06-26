import json
import traceback
from tornado.web import RequestHandler

from .json_encoder import JsonEncoder

class BaseApiHandler(RequestHandler):

    def initialize(self):

        self.logger = self.application.logger
        self.JsonEncoder = JsonEncoder

    def db_action(self, func, *args, **kwargs):

        cursor = self.application.conn.cursor()
        result = func(cursor, *args, **kwargs)
        cursor.close()
        self.application.conn.commit()
        return result

    def db_query(self, func, *args, **kwargs):

        cursor = self.application.conn.cursor()
        func(cursor, *args, **kwargs)
        # TODO: implement paging
        results = [ row for row in cursor ]
        cursor.close()
        return results

    def prepare(self):
        if "application/json" in self.request.headers.get("Content-Type", ""):
            self.json_body = json.loads(self.request.body)
        else:
            self.json_body = None

    def set_default_headers(self):
        self.set_header("Content-Type", "application/json")

    def write_error(self, status_code, **kwargs):

        payload = { }
        if "exc_info" in kwargs:
            etype, value, tb = kwargs["exc_info"]
            payload["messages"] = [ line.strip() for line in traceback.format_exception_only(etype, value) ]
            log_message = kwargs.get("log_message", "An unexpected error occurred")
            self.application.logger.error(log_message, exc_info = kwargs["exc_info"])
        elif "messages" in kwargs:
            payload["messages"]  = kwargs.get("messages")

        self.set_status(status_code)
        self.write(json.dumps(payload))
