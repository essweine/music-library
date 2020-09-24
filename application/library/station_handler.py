import sys
import json
from datetime import date

from . import Station
from ..util import BaseApiHandler

class StationRootHandler(BaseApiHandler):

    def get(self):

        try:
            stations = self.db_query(Station.get_all)
            self.write(json.dumps(stations, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not get station list", exc_info = sys.exc_info())

    def post(self):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])
        try:
            results = self.db_query(Station.search, self.json_body)
            self.write(json.dumps(results, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not perform search", exc_info = sys.exc_info())

class StationHandler(BaseApiHandler):

    def get(self, name):

        try:
            station = self.db_action(Station.get, name)
            if station is not None:
                self.write(json.dumps(station, cls = self.JsonEncoder))
            else:
                self.write_error(404, messages = [ f"Station not found: {name}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get station {name}", exc_info = sys.exc_info())

    def put(self, name):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])
        try:
            self.db_action(Station.update, name, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not update station {name}", exc_info = sys.exc_info())

    def post(self, name):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])
        try:
            self.db_action(Station.create, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not create station {name}", exc_info = sys.exc_info())

    def delete(self, name):

        try:
            self.db_action(Station.delete, name)
        except:
            self.write_error(500, log_message = f"Could not delete station {name}", exc_info = sys.exc_info())

