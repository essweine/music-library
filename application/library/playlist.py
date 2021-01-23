from datetime import datetime
from uuid import uuid4

from .db import Column, Query
from .db import Table, JoinedView, ItemTable, ItemCreator, Search
from .recording import PlaylistTrackView

class PlaylistEntryTable(Table):

    name = "playlist_entry"
    columns = [
        Column("playlist_id", "text", False, True),
        Column("filename", "text", False, True),
        Column("track_num", "int", False, False),
    ]

    @classmethod
    def get_entries(cls, cursor, playlist_id):

        query = Query(cls, [ ("filename", None) ], order = "track_num").compare("playlist_id", playlist_id, "=")
        query.execute(cursor)
        return PlaylistTrackView.from_filenames(cursor, [ fn for (fn, ) in cursor.fetchall() ])

    @classmethod
    def set_entries(cls, cursor, playlist_id, filenames):

        cls.delete_where(cursor, { "playlist_id": playlist_id })
        for idx, filename in enumerate(filenames):
            entry = { "playlist_id": playlist_id, "filename": filename, "track_num": idx }
            cls.insert(cursor, entry)

class PlaylistTable(Table, ItemTable, ItemCreator, Search):

    name = "playlist"
    columns = [
        Column("id", "text", False, True),
        Column("name", "text", True, True),
        Column("rating", "int", False, True),
        Column("length", "int", True, True),
        Column("snippet", "bool", True, True),
        Column("added_date", "date", False, False),
    ]
    identifier_col = "id"
    item_type      = "Playlist"

    search_options = {
        "name": ("text", "Name"),
        "rating": ("rating", "Minimum Rating"),
    }
    search_checkboxes = { "unrated": "Unrated Only" }
    search_sort_columns = [ "name" ]

    @classmethod
    def create(cls, cursor):

        playlist = {
            "id": str(uuid4()),
            "name": "Untitled Playlist",
            "added_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "length": 0,
        }
        cls.insert(cursor, playlist)
        return playlist["id"]

    @classmethod
    def update(cls, cursor, playlist):

        playlist["length"] = len(playlist["filenames"])
        super().update(cursor, playlist)
        PlaylistEntryTable.set_entries(cursor, playlist["id"], playlist["filenames"])

    @classmethod
    def delete(cls, cursor, playlist_id):

        super().delete(cursor, playlist_id)
        PlaylistEntryTable.delete_where(cursor, { "playlist_id": playlist_id })

