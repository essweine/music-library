import sqlite3, re
from datetime import datetime
from dateutil.parser import parse as parsedate
from itertools import chain

from ..util.db import Column, Subquery, ItemTable, JoinedView, Query
from ..util import BaseObject
from .property import PropertyAggregate, TRACK_PROPS, TRACK_AGGREGATE

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
RecordingTable = ItemTable("recording", RECORDING_COLUMNS, "id")

TRACK_COLUMNS = [
    Column("recording_id", "text", False, True),
    Column("filename", "text", False, True),
    Column("track_num", "int", True, False),
    Column("title", "text", True, True),
    Column("rating", "int", True, True),
]
TrackTable = ItemTable("track", TRACK_COLUMNS, "filename")

TRACK_SUBQUERY = Subquery([ (col.name, None) for col in TRACK_COLUMNS ], TrackTable, False)
RECORDING_SUBQUERY = Subquery([
    ("recording_id", "id"),
    ("recording", "title"),
    ("artwork", None),
    ("recording_date", None),
    ("recording_rating", "rating"),
    ("sound_rating", None),
    ("official", None),
], RecordingTable, False)
RecordingTrackView = JoinedView("recording_track", (TRACK_SUBQUERY, RECORDING_SUBQUERY))

LibraryTrackView = JoinedView("library_track", (TRACK_SUBQUERY, TRACK_PROPS), TRACK_AGGREGATE)

class Recording(BaseObject):

    def __init__(self, **recording):

        for column in RECORDING_COLUMNS:
            self.__setattr__(column.name, recording.get(column.name))
        self.tracks = recording.get("tracks", [ ])

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

        RecordingTable.set_rating(cursor, rating)

    @staticmethod
    def set_sound_rating(cursor, rating):

        update = "update recording set sound_rating=? where id=?"
        cursor.execute(update, (rating.value, rating.item_id))

    @staticmethod
    def set_track_rating(cursor, rating):

        TrackTable.set_rating(cursor, rating)

    @staticmethod
    def sort(recording):

        return (recording.artist, recording.recording_date if recording.recording_date else "")

class LibraryTrack(PropertyAggregate):

    PROPERTIES = [ "artist", "composer", "guest", "genre" ]

    def __init__(self, **track):

        super(LibraryTrack, self).__init__(track)
        for name, definition in TRACK_SUBQUERY.columns:
            self.__setattr__(name, track.get(name))

    @classmethod
    def create(cls, cursor, track):

        cls._update_properties(cursor, track)
        TrackTable.insert(cursor, track)

    @classmethod
    def update(cls, cursor, track):

        cls._update_properties(cursor, track)
        TrackTable.update(cursor, track)
