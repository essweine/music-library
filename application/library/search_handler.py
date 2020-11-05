import sys
import json

from ..util import BaseApiHandler
from . import Search

class SearchHandler(BaseApiHandler):

    def get(self, item_type):

        try:
            config = self.db_action(Search.configuration, item_type)
            self.write(json.dumps(config, cls = self.JsonEncoder))
        except ValueError as exc:
            self.write_error(400, messages = [ f"Invalid search type: {item_type}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get search configuration for {item_type}", exc_info = sys.exc_info())

    def post(self, item_type):

        if not self.json_body:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            results = self.db_query(Search.search, item_type, self.json_body)
            self.write(json.dumps(results, cls = self.JsonEncoder))
        except ValueError as exc:
            self.write_error(400, messages = [ f"Invalid search type: {item_type}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not execute {item_type} query", exc_info = sys.exc_info())

class PropertyHandler(BaseApiHandler):

    def get(self, prop):

        result = self.db_action(Search.property_values, prop)
        self.write(json.dumps(result, cls = self.JsonEncoder))

