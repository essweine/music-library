import sys
import json

from ..util import BaseApiHandler
from . import RecordingTable, TrackTable, StationTable, PlaylistTable, PodcastTable

class Rating(object):

    def __init__(self, item_type, item_id, value):

        self.item_type = item_type
        self.item_id   = item_id
        self.value     = value

class RatingHandler(BaseApiHandler):

    def post(self):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            rating = Rating(**self.json_body)
            if rating.item_type == "recording-rating":
                self.db_action(RecordingTable.set_rating, rating)
            elif rating.item_type == "recording-sound-rating":
                self.db_action(RecordingTable.set_sound_rating, rating)
            elif rating.item_type == "track":
                self.db_action(TrackTable.set_rating, rating)
            elif rating.item_type == "playlist":
                self.db_action(PlaylistTable.set_rating, rating)
            elif rating.item_type == "station":
                self.db_action(StationTable.set_rating, rating)
            elif rating.item_type == "podcast":
                self.db_action(PodcastTable.set_rating, rating)
        except Exception as exc:
            self.write_error(500, log_message = "Could not update rating", exc_info = sys.exc_info())

