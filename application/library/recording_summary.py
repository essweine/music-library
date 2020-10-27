import sqlite3, re
from datetime import datetime
from dateutil.parser import parse as parsedate
from itertools import chain

from ..util.db import Column, Subquery, Table, JoinedView, Query
from ..util import BaseObject
from .property import PropertyView
from .recording import RecordingTable

SUMMARY_SUBQUERY = Subquery([
    ("id", None),
    ("title", None),
    ("recording_date", None),
    ("rating", None),
    ("sound_rating", None),
    ("official", None),
], RecordingTable, False)

RecordingArtistView = PropertyView("artist", "recording_id")

ARTIST_SUBQUERY = Subquery([
    ("id", "recording_id"),
    ("artist", "value"),
], RecordingArtistView, False)

RecordingSummaryView = JoinedView("recording_summary", (SUMMARY_SUBQUERY, ARTIST_SUBQUERY))

class RecordingSummary(BaseObject):

    def __init__(self, **recording):

        for name, definition in SUMMARY_SUBQUERY.columns + ARTIST_SUBQUERY.columns:
            self.__setattr__(name, recording.get(name))
        self.artist = sorted(self.artist.split("::"))

    @classmethod
    def get_all(cls, cursor):

        RecordingSummaryView.get_all(cursor, cls.row_factory, "artist")

