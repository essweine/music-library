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
        self.files = playlist.get("files", [ ])

    @classmethod
    def get(cls, cursor, playlist_id):

        PlaylistTable.get(cursor, playlist_id)
        playlist = cursor.fetchone()
        if playlist is not None:
            playlist = dict(playlist)
            query = Query(PlaylistEntryTable.name, order = "track_num").compare("playlist_id", playlist_id, "=")
            query.execute(cursor, PlaylistEntry.row_factory)
            playlist["files"] = cursor.fetchall()
            return cls(**playlist)
        else:
            return None

    @classmethod
    def get_all(cls, cursor):

        PlaylistTable.get_all(cursor, Playlist.row_factory, "name")

    @staticmethod
    def create(cursor, playlist):

        playlist["id"] = str(uuid4())
        playlist["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        PlaylistTable.insert(cursor, playlist)
        for idx, filename in enumerate(playlist.get("files", [ ])):
            entry = { "playlist_id": playlist["id"], "filename": filename, "track_num": idx }
            PlaylistEntryTable.insert(cursor, entry)

    @staticmethod
    def update(cursor, playlist):

        PlaylistTable.update(cursor, playlist)
        PlaylistEntryTable.delete_where(cursor, { "playlist_id": playlist["id"] })
        for idx, filename in enumerate(playlist.get("files", [ ])):
            entry = { "playlist_id": playlist["id"], "filename": filename, "track_num": idx }
            PlaylistEntryTable.insert(cursor, entry)

    @staticmethod
    def set_rating(cursor, rating):

        PlaylistTable.set_rating(cursor, rating)

    @staticmethod
    def delete(cursor, playlist_id):

        PlaylistTable.delete(cursor, playlist_id)

class PlaylistEntry(BaseObject):

    def __init__(self, **entry):

        for column in PLAYLIST_ENTRY_COLUMNS:
            self.__setattr__(column.name, entry.get(column.name))

class PlaylistTrack(PropertyAggregate):

    PROPERTIES = [ "artist" ]

    def __init__(self, **track):

        super(PlaylistTrack, self).__init__(track)
        for name, definition in PLAYLIST_SUBQUERY.columns:
            self.__setattr__(name, track.get(name))

    @classmethod
    def from_filenames(cls, cursor, filenames):

        Query("playlist_track").compare_set("filename", filenames).execute(cursor, cls.row_factory)

