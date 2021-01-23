import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date
from copy import deepcopy

from application.library import TABLES, VIEWS
from application.importer import DirectoryService
from application.library import LibrarySearchView, TrackTable, PlaylistTable, PlaylistEntryTable, PlaylistTrackView
from application.library.rating_handler import Rating
from application.library.db.search import DEFAULT_QUERY
from . import ROOT_PATH, DEFAULT_INDEX, DB_NAME

class TestPlaylist(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

        cls.default_playlist_query = deepcopy(DEFAULT_QUERY)
        cls.default_playlist_query["sort"] = [ "name" ]
        cls.default_track_query = deepcopy(DEFAULT_QUERY)
        cls.default_track_query["sort"] = [ "title" ]

        cls.conn = sqlite3.connect(DB_NAME, detect_types = sqlite3.PARSE_DECLTYPES)

        directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX)
        cursor = cls.conn.cursor()
        for item in TABLES + VIEWS:
            item.initialize(cursor)
        cls.conn.commit()

        directory = directory_service.get_directory("root/Keep It Like A Secret")
        cls.kilas = directory_service.create_recording(directory, directory.text[0])

        directory = directory_service.get_directory("root/Edge of the Sun")
        directory_service.aggregate(directory)
        cls.edge = directory_service.create_recording(directory, directory.text[0])

        LibrarySearchView.create_recording(cursor, cls.kilas.serialize())
        LibrarySearchView.create_recording(cursor, cls.edge.serialize())

        cursor.close()

    @classmethod
    def tearDownClass(cls):

        cls.conn.close()
        os.remove(DB_NAME)

    def get_filename(self, recording, track_num):

        return [ track.filename for track in recording.tracks ][track_num]

    def test_001_create_playlist(self):

        cursor = self.conn.cursor()
        playlist_id = PlaylistTable.create(cursor)
        cursor.close()

    def test_002_get_all_playlists(self):

        cursor = self.conn.cursor()
        PlaylistTable.get_all(cursor, "name")
        playlists = cursor.fetchall()
        self.assertEqual(len(playlists), 1)
        cursor.close()

    def test_003_get_playlist(self):

        cursor = self.conn.cursor()

        PlaylistTable.get_all(cursor, "name")
        playlists = cursor.fetchall()
        playlist = PlaylistTable.get(cursor, playlists[0].id)

        self.assertEqual(playlist.name, "Untitled Playlist")
        self.assertEqual(playlist.length, 0)

        cursor.close()

    def test_004_update_playlist(self):

        cursor = self.conn.cursor()

        PlaylistTable.get_all(cursor, "name")
        playlists = cursor.fetchall()
        playlist = PlaylistTable.get(cursor, playlists[0].id)
        playlist.name = "Test Playlist"
        filenames = [
            self.get_filename(self.kilas, 0),
            self.get_filename(self.edge, 0),
        ]
        playlist.filenames = filenames

        PlaylistTable.update(cursor, playlist.serialize())
        rating = Rating("playlist", playlist.id, 5)
        PlaylistTable.set_rating(cursor, rating)

        playlist = PlaylistTable.get(cursor, playlists[0].id)
        self.assertEqual(playlist.name, "Test Playlist")
        self.assertEqual(playlist.length, 2)

        entries = PlaylistEntryTable.get_entries(cursor, playlists[0].id)
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0].filename, filenames[0])
        self.assertEqual(playlist.rating, 5)

        cursor.close()

    def test_005_playlist_search_config(self):

        cursor = self.conn.cursor()
        config = PlaylistTable.search_configuration(cursor)

        default_query = config["default_query"]
        self.assertEqual(default_query, self.default_playlist_query)

        search_options = config["search_options"]

        order = sorted(PlaylistTable.search_options, key = lambda k: PlaylistTable.search_options[k][1])
        self.assertListEqual(order, list(search_options.keys()))

        self.assertEqual(search_options["name"]["type"], PlaylistTable.search_options["name"][0])
        self.assertEqual(search_options["name"]["display"], PlaylistTable.search_options["name"][1])
        self.assertEqual(len(search_options["name"]["values"]), 0)
        
    def test_006_search_playlists(self):

        cursor = self.conn.cursor()
        playlist_id = PlaylistTable.create(cursor)

        name_search = deepcopy(self.default_playlist_query)
        name_search["match"].append({ "name": "Untitled Playlist" })
        PlaylistTable.search(cursor, name_search)
        name_result = cursor.fetchall()
        self.assertEqual(len(name_result), 1)
        self.assertEqual(name_result[0].name, "Untitled Playlist")

        rating = Rating("playlist", playlist_id, 5)
        PlaylistTable.set_rating(cursor, rating)

        rating_search = deepcopy(self.default_playlist_query)
        rating_search["match"].append({ "rating": 5 })
        PlaylistTable.search(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 2)

        cursor.close()

    def test_007_track_search_config(self):

        cursor = self.conn.cursor()
        config = PlaylistTrackView.search_configuration(cursor)

        default_query = config["default_query"]
        self.assertEqual(default_query, self.default_track_query)

        search_options = config["search_options"]

        order = sorted(PlaylistTrackView.search_options, key = lambda k: PlaylistTrackView.search_options[k][1])
        self.assertListEqual(order, list(search_options.keys()))

        self.assertEqual(search_options["recording"]["type"], PlaylistTrackView.search_options["recording"][0])
        self.assertEqual(search_options["recording"]["display"], PlaylistTrackView.search_options["recording"][1])
        self.assertEqual(len(search_options["recording"]["values"]), 0)
        self.assertEqual(search_options["artist"]["type"], "text")
        self.assertListEqual(search_options["genre"]["values"], [ ])
        
        cursor.close()

    def test_008_search_tracks(self):

        cursor = self.conn.cursor()

        title_search = deepcopy(self.default_track_query)
        title_search["match"].append({ "title": "The Plan" })
        PlaylistTrackView.search(cursor, title_search)
        title_results = cursor.fetchall()
        self.assertEqual(len(title_results), 1)

        recording_search = deepcopy(self.default_track_query)
        recording_search["match"].append({ "recording": "Keep It Like a Secret" })
        PlaylistTrackView.search(cursor, recording_search)
        recording_results = cursor.fetchall()
        self.assertEqual(len(recording_results), 3)

        for track in recording_results:
            TrackTable.set_rating(cursor, Rating("track", track.filename, 5))

        rating_search = deepcopy(self.default_track_query)
        rating_search["match"].append({ "rating": 5 })
        PlaylistTrackView.search(cursor, rating_search)
        rating_results = cursor.fetchall()
        self.assertEqual(len(rating_results), 3)

        recording_id = recording_results[0].recording_id
        recording = LibrarySearchView.get_recording(cursor, recording_id)
        recording.official = True
        LibrarySearchView.update_recording(cursor, recording.serialize())

        official_search = deepcopy(self.default_track_query)
        official_search["nonofficial"] = False
        PlaylistTrackView.search(cursor, official_search)
        official_results = cursor.fetchall()
        self.assertEqual(len(official_results), 3)

        unrated_search = deepcopy(self.default_track_query)
        unrated_search["unrated"] = True
        PlaylistTrackView.search(cursor, unrated_search)
        unrated_results = cursor.fetchall()
        self.assertEqual(len(unrated_results), 6)

        artist_search = deepcopy(self.default_track_query)
        artist_search["match"].append({ "artist": "Built To Spill" })
        PlaylistTrackView.search(cursor, artist_search)
        artist_results = cursor.fetchall()
        self.assertEqual(len(artist_results), 3)

        exclude_search = deepcopy(self.default_track_query)
        exclude_search["exclude"].append({ "artist": "Built To Spill" })
        PlaylistTrackView.search(cursor, exclude_search)
        exclude_results = cursor.fetchall()
        self.assertEqual(len(exclude_results), 6)

        cursor.close()

    def test_009_delete_playlist(self):

        cursor = self.conn.cursor()
        name_search = deepcopy(self.default_playlist_query)
        name_search["match"].append({ "name": "Untitled Playlist" })
        PlaylistTable.search(cursor, name_search)
        name_result = cursor.fetchall()
        PlaylistTable.delete(cursor, name_result[0].id)
        PlaylistTable.get_all(cursor, "name")
        playlists = cursor.fetchall()
        self.assertEqual(len(playlists), 1)
        cursor.close()
        

