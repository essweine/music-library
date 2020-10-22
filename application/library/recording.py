import sqlite3, re
from datetime import datetime
from dateutil.parser import parse as parsedate
from itertools import chain

from ..util.db import Column, Subquery, Table, View, Query
from ..util import BaseObject
from .property import PropertyView, RECORDING_PROPS, RECORDING_AGGREGATE
from .track import LibraryTrackView, LibraryTrack

RECORDING_COLUMNS = [
    Column("id", "text", False, False),
    Column("directory", "text", False, False),
    Column("title", "text", True, True),
    Column("notes", "text", True, False),
    Column("artwork", "text", True, False),
    Column("recording_date", "date", True, True),
    Column("venue", "text", True, True),
    Column("added_date", "date", False, False),
    Column("rating", "int", False, True),
    Column("sound_rating", "int", False, True),
    Column("official", "bool", True, True),
]

SUMMARY_SUBQUERY = Subquery([
    ("id", None),
    ("title", None),
    ("recording_date", None),
    ("rating", None),
    ("sound_rating", None),
    ("official", None),
], "recording", False)

RecordingTable = Table("recording", RECORDING_COLUMNS, "id")
RecordingSummaryView = View("recording_summary", (SUMMARY_SUBQUERY, RECORDING_PROPS), RECORDING_AGGREGATE)

class RecordingSummary(PropertyView):

    PROPERTIES = [ "artist", "genre" ]

    def __init__(self, **recording):

        super(RecordingSummary, self).__init__(recording)
        for name, definition in SUMMARY_SUBQUERY.columns:
            self.__setattr__(name, recording.get(name))

    @classmethod
    def get_all(cls, cursor):

        RecordingSummaryView.get_all(cursor, cls.row_factory)

class Recording(BaseObject):

    def __init__(self, **recording):

        for column in RECORDING_COLUMNS:
            self.__setattr__(column.name, recording.get(column.name))

        self.tracks = recording.get("tracks", [ ])
        self.artist = sorted(set(chain.from_iterable([ track.artist for track in self.tracks ])))
        self.genre  = sorted(set(chain.from_iterable([ track.genre for track in self.tracks ])))

    @classmethod
    def get(cls, cursor, recording_id):

        RecordingTable.get(cursor, recording_id)
        recording = cursor.fetchone()
        if recording is not None:
            query = Query(LibraryTrackView.name).compare("recording_id", recording_id, "=")
            query.execute(cursor, LibraryTrack.row_factory)
            recording = dict(recording)
            recording["tracks"] = cursor.fetchall()
            return cls(**recording)
        else:
            return None

    @staticmethod
    def create(cursor, recording):

        recording["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        RecordingTable.insert(cursor, recording)

        for track in recording.get("tracks", [ ]):
            track["recording_id"] = recording["id"]
            LibraryTrack.create(cursor, track)

    @staticmethod
    def update(cursor, recording):

        RecordingTable.update(cursor, recording)
        for track in recording.get("tracks", [ ]):
            LibraryTrack.update(cursor, track)

    @staticmethod
    def validate(recording):

        # Could add other validation, but not sure how useful that would be.
        validation = [ ]
        try:
            if recording["recording_date"]:
                recording["recording_date"] = parsedate(recording["recording_date"]).strftime("%Y-%m-%d")
        except:
            validation.append(f"Invalid date: {recording['recording_date']}")
        return validation

    @staticmethod
    def set_rating(cursor, rating):

        if rating.rated_item == "rating":
            update = "update recording set rating=? where id=?"
            values = (rating.value, rating.item_id)
        elif rating.rated_item == "sound-rating":
            update = "update recording set sound_rating=? where id=?"
            values = (rating.value, rating.item_id)
        else:
            update = "update track set rating=? where filename=?"
            values = (rating.value, rating.rated_item)

        cursor.execute(update, values)

    @staticmethod
    def sort(recording):

        return (recording.artist, recording.recording_date)

