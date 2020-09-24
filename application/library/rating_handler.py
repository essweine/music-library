import sys
import json

from ..util import BaseApiHandler
from . import Recording, Station

class Rating(object):

    def __init__(self, item_type, item_id, rated_item, value):

        self.item_type  = item_type
        self.item_id    = item_id
        self.rated_item = rated_item
        self.value      = value

class RatingHandler(BaseApiHandler):

    def post(self):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            rating = Rating(**self.json_body)
            if rating.item_type == "recording":
                self.db_action(Recording.set_rating, rating)
            elif rating.item_type == "station":
                self.db_action(Station.set_rating, rating)
        except Exception as exc:
            self.write_error(500, log_message = "Could update rating", exc_info = sys.exc_info())
