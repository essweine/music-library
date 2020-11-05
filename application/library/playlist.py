from datetime import datetime
from uuid import uuid4

from ..util import BaseObject
from ..util.db import Column, Subquery, Table, ItemTable, JoinedView, Query
from .property import PropertyAggregate, TRACK_PROPS, TRACK_AGGREGATE
from .recording import RecordingTrackView

PLAYLIST_COLUMNS = [
    Column("id", "text", False, True),
    Column("name", "text", True, True),
    Column("rating", "int", False, True),
    Column("length", "int", True, True),
    Column("snippet", "bool", True, True),
    Column("added_date", "date", False, False),
]
PlaylistTable = ItemTable("playlist", PLAYLIST_COLUMNS, "id")

PLAYLIST_ENTRY_COLUMNS = [
    Column("playlist_id", "text", False, True),
    Column("filename", "text", False, True),
    Column("track_num", "int", False, False),
]
PlaylistEntryTable = Table("playlist_entry", PLAYLIST_ENTRY_COLUMNS)

PLAYLIST_SUBQUERY = Subquery([
    ("recording_id", None),
    ("filename", None),
    ("title", None),
    ("rating", None),
    ("recording", None),
    ("artwork", None),
], RecordingTrackView, False)
PlaylistTrackView = JoinedView("playlist_track", (PLAYLIST_SUBQUERY, TRACK_PROPS), TRACK_AGGREGATE)

class Playlist(BaseObject):

    def __init__(self, **playlist):

        for column in PLAYLIST_COLUMNS:
            self.__setattr__(column.name, playlist.get(column.name))
        self.filenames = playlist.get("filenames", [ ])

    @classmethod
    def get(cls, cursor, playlist_id):

        PlaylistTable.get(cursor, playlist_id)
        playlist = cursor.fetchone()
        if playlist is not None:
            playlist = cls(**dict(playlist))
            PlaylistEntry.get(cursor, playlist_id)
            playlist.filenames = cursor.fetchall()
            return playlist

    @classmethod
    def get_all(cls, cursor):

        PlaylistTable.get_all(cursor, Playlist.row_factory, "name")

    @staticmethod
    def create(cursor):

        playlist = {
            "id": str(uuid4()),
            "name": "Untitled Playlist",
            "added_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "length": 0,
            "filenames": [ ],
        }
        PlaylistTable.insert(cursor, playlist)
        return playlist["id"]

    @staticmethod
    def update(cursor, playlist):

        playlist["length"] = len(playlist["filenames"])
        PlaylistTable.update(cursor, playlist)
        PlaylistEntry.update(cursor, playlist["id"], playlist["filenames"])

    @staticmethod
    def set_rating(cursor, rating):

        PlaylistTable.set_rating(cursor, rating)

    @staticmethod
    def delete(cursor, playlist_id):

        PlaylistTable.delete(cursor, playlist_id)
        PlaylistEntryTable.delete_where(cursor, { "playlist_id": playlist_id })

class PlaylistEntry(BaseObject):

    def __init__(self, **entry):

        for column in PLAYLIST_ENTRY_COLUMNS:
            self.__setattr__(column.name, entry.get(column.name))

    @classmethod
    def get(cls, cursor, playlist_id):

        Query("playlist_entry",
            select = [ ("filename", None) ],
            order = "track_num"
        ).compare("playlist_id", playlist_id, "=").execute(cursor, cls.row_factory)

    @staticmethod
    def create(cursor, playlist_id, filenames):

        for idx, filename in enumerate(filenames):
            entry = { "playlist_id": playlist_id, "filename": filename, "track_num": idx }
            PlaylistEntryTable.insert(cursor, entry)

    @staticmethod
    def update(cursor, playlist_id, filenames):

        PlaylistEntryTable.delete_where(cursor, { "playlist_id": playlist_id })
        for idx, filename in enumerate(filenames):
            entry = { "playlist_id": playlist_id, "filename": filename, "track_num": idx }
            PlaylistEntryTable.insert(cursor, entry)

class PlaylistTrack(PropertyAggregate):

    PROPERTIES = [ "artist" ]

    def __init__(self, **track):

        super(PlaylistTrack, self).__init__(track)
        for name, definition in PLAYLIST_SUBQUERY.columns:
            self.__setattr__(name, track.get(name))

    @classmethod
    def from_filenames(cls, cursor, filenames):

        sort = lambda track: filenames.index(track.filename)
        Query("playlist_track").compare_set("filename", filenames).execute(cursor, cls.row_factory)
        return sorted(cursor.fetchall(), key = sort)

    @classmethod
    def from_playlist_id(cls, cursor, playlist_id):

        PlaylistEntry.get(cursor, playlist_id)
        filenames = [ entry.filename for entry in cursor.fetchall() ]
        return cls.from_filenames(cursor, filenames)

