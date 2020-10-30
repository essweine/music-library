import sys
import json

from ..util import BaseApiHandler
from . import Search

class SearchConfigHandler(BaseApiHandler):

    def get(self, config_type):

        try:
            config = self.db_action(Search.configuration, config_type)
            self.write(json.dumps(config, cls = self.JsonEncoder))
        except ValueError as exc:
            self.write_error(400, messages = [ f"Invalid search type: {config_type}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get search configuration for {config_type}", exc_info = sys.exc_info())

class PropertyHandler(BaseApiHandler):

    def get(self, prop):

        result = self.db_action(Search.property_values, prop)
        self.write(json.dumps(result, cls = self.JsonEncoder))

