from datetime import datetime
from dateutil.parser import parse as parsedate
from uuid import uuid4

from .db import Column, Query
from .db import Table, JoinedView, ItemTable, ItemCreator, Search

class PropertyTable(Table):
    """This table contains mappings between tracks and one-to-many properties (eg artist)."""

    name    = "property"
    columns = [
        Column("recording_id", "text", False, True),
        Column("filename", "text", False, True),
        Column("category", "text", True, True),
        Column("value", "text", True, True),
    ]

    @classmethod
    def create_view(cls, name, props, aggregate_col):

        union = [ ]
        for prop in props:
            cols = ", ".join([ "{0} as {1}".format("value" if prop == p else "null", p) for p in props ])
            union.append(f"select distinct {aggregate_col}, {cols} from property where category='{prop}'")

        subquery = " union ".join(union)
        columns = [ (prop, f"group_concat({prop}, '::')") for prop in props ]
        select = ", ".join([ f"{definition} as {name}" for name, definition in columns ])
        order = "order by " + ", ".join(props)
        stmt = f"create view if not exists {name} as select {aggregate_col}, {select} from ({subquery} {order}) group by {aggregate_col}"

        def initialize(cursor):
            cursor.execute(stmt)

        return type("PropertyView", (Table, ), { "name": name, "columns": columns, "initialize": initialize })

RecordingPropertyView = PropertyTable.create_view("recording_property", [ "artist" ], "recording_id")
TrackPropertyView = PropertyTable.create_view("track_property", [ "artist", "composer", "guest", "genre" ], "filename")

class TrackTable(Table, ItemTable):
    """This table contains one-to-one properties for each track and manages property updates."""

    name    = "track"
    columns = [
        Column("recording_id", "text", False, True),
        Column("filename", "text", False, True),
        Column("track_num", "int", True, False),
        Column("title", "text", True, True),
        Column("rating", "int", True, True),
    ]
    identifier_col = "filename"
    item_type      = "Track"

class RecordingTable(Table, ItemTable, ItemCreator):
    """This table contains one-to-one properties for each recording."""

    name    = "recording"
    columns = [
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
    identifier_col = "id"
    item_type      = "Recording"

    @classmethod
    def set_sound_rating(cls, cursor, rating):

        update = "update recording set sound_rating=? where id=?"
        cursor.execute(update, (rating.value, rating.item_id))

class LibraryTrackView(JoinedView, ItemCreator):
    """This view adds one-to-many properties stored in the property table to the tracks."""

    name       = "library_track"
    props      = [ "artist", "composer", "guest", "genre" ]
    subqueries = (
        Query(TrackTable, [ (col.name, None) for col in TrackTable.columns ]),
        Query(TrackPropertyView, [ ("filename", None) ] + [ (prop, None) for prop in props ])
    )
    identifier_col = "filename"
    item_type      = "LibraryTrack"

    @classmethod
    def create(cls, cursor, track):

        TrackTable.insert(cursor, track)
        cls._set_props(cursor, track)

    @classmethod
    def update(cls, cursor, track):

        TrackTable.update(cursor, track)
        cls._set_props(cursor, track)

    @classmethod
    def _set_props(cls, cursor, track):

        recording_id, filename = track.get("recording_id"), track.get("filename")
        for prop in cls.props:
            category = { "recording_id": recording_id, "filename": filename, "category": prop }
            PropertyTable.delete_where(cursor, category)
            for value in track.pop(prop, [ ]):
                category.update({ "value": value })
                PropertyTable.insert(cursor, category)

class RecordingTrackView(JoinedView):
    """This view links data stored with the track to data stored with the recording."""

    name = "recording_track"
    subqueries = (
        Query(TrackTable, [ (col.name, None) for col in TrackTable.columns ]),
        Query(RecordingTable, [
            ("recording_id", "id"),
            ("recording", "title"),
            ("artwork", None),
            ("recording_date", None),
            ("recording_rating", "rating"),
            ("sound_rating", None),
            ("official", None),
        ])
    )

class LibrarySearchView(JoinedView):

    """This view adds unaggregated property data to the combined recording/track data with 
    one row per property per filename, to allow searching for tracks by property value."""

    name = "library_search"
    subqueries = (
        Query(RecordingTrackView, [
            ("recording_id", None),
            ("filename", None),
            ("title", None),
            ("rating", None),
            ("recording", None),
            ("recording_date", None),
            ("recording_rating", None),
            ("sound_rating", None),
            ("official", None),
        ]),
        Query(PropertyTable, [ ("filename", None), ("category", None), ("value", None), ])
    )

    @classmethod
    def get_recording(cls, cursor, recording_id):

        recording = RecordingTable.get(cursor, recording_id)
        cls.get_tracks(cursor, recording_id)
        recording.tracks = cursor.fetchall()
        return recording

    @classmethod
    def get_tracks(cls, cursor, recording_id):

        query = Query(LibraryTrackView).compare("recording_id", recording_id, "=")
        query.execute(cursor, LibraryTrackView.row_factory)

    @classmethod
    def create_recording(cls, cursor, recording):

        recording["id"] = str(uuid4())
        recording["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        for track in recording.pop("tracks", [ ]):
            track["recording_id"] = recording["id"]
            LibraryTrackView.create(cursor, track)
        RecordingTable.insert(cursor, recording)
        return recording["id"]

    @classmethod
    def update_recording(cls, cursor, recording):

        for track in recording.pop("tracks", [ ]):
            LibraryTrackView.update(cursor, track)
        RecordingTable.update(cursor, recording)

    @classmethod
    def update_tracks(cls, cursor, tracks):

        for track in tracks:
            LibraryTrackView.update(cursor, track)

    @staticmethod
    def validate(recording):

        validation = [ ]
        try:
            if recording["recording_date"]:
                recording["recording_date"] = parsedate(recording["recording_date"]).strftime("%Y-%m-%d")
        except:
            validation.append(f"Invalid date: {recording['recording_date']}")
        return validation

library_checkboxes = { "official": "Official", "nonofficial": "Non-official", "unrated": "Unrated Only" }

class RecordingSummaryView(JoinedView, ItemCreator, Search):
    """This view links the track data stored with the artist to the recording."""

    name       = "recording_summary"
    props      = [ "artist" ]
    subqueries = (
        Query(RecordingTable, [
            ("id", None),
            ("title", None),
            ("recording_date", None),
            ("rating", None),
            ("sound_rating", None),
            ("official", None),
        ]),
        Query(RecordingPropertyView, [ ("id", "recording_id"), ("artist", None) ])
    )
    identifier_col = "id"
    item_type      = "RecordingSummary"

    search_options = {
        "recording": ("text", "Title"),
        "recording_rating": ("rating", "Minimum Rating"),
        "sound_rating": ("rating", "Minimum Sound Rating"),
        "recording_date": ("date_search", "Date"),
        "title": ("text", "Contains Track"),
        "artist": ("category", "Artist"),
        "composer": ("category", "Composer"),
        "genre": ("options", "Genre"),
    } 
    search_checkboxes   = library_checkboxes
    search_sort_columns = [ "artist", "recording_date" ]
    search_source       = LibrarySearchView
    search_column       = "recording_id"

class PlaylistTrackView(JoinedView, ItemCreator, Search):
    """This view adds aggregated property data to the combined recording/track data with one row per filename, 
    which contains all the data the player needs to display the track."""

    name       = "playlist_track"
    subqueries = (
        Query(RecordingTrackView, [
            ("recording_id", None),
            ("filename", None),
            ("title", None),
            ("rating", None),
            ("recording", None),
            ("artwork", None),
        ]),
        Query(TrackPropertyView, [ ("filename", None), ("artist", None) ])
    )
    identifier_col = "filename"
    item_type      = "PlaylistTrack"

    search_options = {
        "recording": ("text", "From Recording"),
        "title": ("text", "Title"),
        "rating": ("rating", "Minimum Rating"),
        "artist": ("category", "Artist"),
        "guest": ("category", "Guest Artist"),
        "composer": ("category", "Composer"),
        "genre": ("options", "Genre"),
    }
    search_checkboxes   = library_checkboxes
    search_sort_columns = [ "title" ]
    search_source       = LibrarySearchView
    search_column       = "filename"

    @classmethod
    def from_filenames(cls, cursor, filenames):

        sort = lambda track: filenames.index(track.filename)
        Query(cls).compare_set("filename", filenames).execute(cursor, cls.row_factory)
        return sorted(cursor.fetchall(), key = sort)

