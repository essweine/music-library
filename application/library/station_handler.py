import sys
import json

from .station import StationTable
from ..util import BaseApiHandler, BaseSearchHandler

class StationRootHandler(BaseApiHandler):

    def get(self):

        try:
            stations = self.db_query(StationTable.get_all, "name")
            self.write(json.dumps(stations, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not get station list", exc_info = sys.exc_info())

    def post(self):

        try:
            station_id = self.db_action(StationTable.create, self.json_body)
            self.write(json.dumps({ "id": station_id }))
        except:
            self.write_error(500, log_message = f"Could not create station", exc_info = sys.exc_info())

class StationSearchHandler(BaseSearchHandler):

    SearchType = "station"

    def get_configuration(self):
        return self.db_action(StationTable.search_configuration)

    def search(self):
        return self.db_query(StationTable.search, self.json_body)

class StationHandler(BaseApiHandler):

    def get(self, station_id):

        try:
            station = self.db_action(StationTable.get, station_id)
            if station is not None:
                self.write(json.dumps(station, cls = self.JsonEncoder))
            else:
                self.write_error(404, messages = [ f"Station not found: {station_id}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get station {station_id}", exc_info = sys.exc_info())

    def put(self, station_id):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])
        try:
            self.db_action(StationTable.update, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not update station {station_id}", exc_info = sys.exc_info())

    def delete(self, station_id):

        try:
            self.db_action(StationTable.delete, station_id)
        except:
            self.write_error(500, log_message = f"Could not delete station {station_id}", exc_info = sys.exc_info())

