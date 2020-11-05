import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date

from application.importer import DirectoryService
from application.library import Recording, Playlist, PlaylistTrack
from application.library.rating_handler import Rating
from application.library.search import Search, PLAYLIST_OPTIONS, TRACK_OPTIONS
from application.config import TABLES, VIEWS
from . import ROOT_PATH, DEFAULT_INDEX, DB_NAME

class TestPlaylist(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

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

        Recording.create(cursor, cls.kilas.as_dict())
        Recording.create(cursor, cls.edge.as_dict())

        cursor.close()

    @classmethod
    def tearDownClass(cls):

        cls.conn.close()
        os.remove(DB_NAME)

    def get_filename(self, recording, track_num):

        return [ track.filename for track in recording.tracks ][track_num]

    def build_playlist_search_params(self, **params):

        return {
            "match": params.get("match", [ ]),
            "exclude": params.get("exclude", [ ]),
            "unrated": params.get("unrated", False),
            "sort": [ "name" ],
            "order": "asc",
        }

    def build_track_search_params(self, **params):

        return { 
            "match": params.get("match", [ ]),
            "exclude": params.get("exclude", [ ]),
            "official": params.get("official", True),
            "nonofficial": params.get("nonofficial", True),
            "unrated": params.get("unrated", False),
        }

    def test_001_create_playlist(self):

        cursor = self.conn.cursor()
        playlist_id = Playlist.create(cursor)
        cursor.close()

    def test_002_get_all_playlists(self):

        cursor = self.conn.cursor()
        Playlist.get_all(cursor)
        playlists = cursor.fetchall()
        self.assertEqual(len(playlists), 1)
        cursor.close()

    def test_003_get_playlist(self):

        cursor = self.conn.cursor()

        Playlist.get_all(cursor)
        playlists = cursor.fetchall()
        playlist = Playlist.get(cursor, playlists[0].id)

        self.assertEqual(playlist.name, "Untitled Playlist")
        self.assertEqual(playlist.length, 0)
        self.assertEqual(len(playlist.filenames), 0)

        cursor.close()

    def test_004_update_playlist(self):

        cursor = self.conn.cursor()

        Playlist.get_all(cursor)
        playlists = cursor.fetchall()
        playlist = Playlist.get(cursor, playlists[0].id)
        playlist.name = "Test Playlist"
        filenames = [
            self.get_filename(self.kilas, 0),
            self.get_filename(self.edge, 0),
        ]
        playlist.filenames = filenames

        Playlist.update(cursor, playlist.as_dict())
        rating = Rating("playlist", playlist.id, 5)
        Playlist.set_rating(cursor, rating)

        playlist = Playlist.get(cursor, playlists[0].id)
        self.assertEqual(playlist.name, "Test Playlist")
        self.assertEqual(playlist.length, 2)

        entries = PlaylistTrack.from_playlist_id(cursor, playlists[0].id)
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0].filename, filenames[0])
        self.assertEqual(playlist.rating, 5)

        cursor.close()

    def test_005_playlist_search_config(self):

        cursor = self.conn.cursor()
        config = Search.configuration(cursor, "playlist")

        order = sorted(PLAYLIST_OPTIONS, key = lambda k: PLAYLIST_OPTIONS[k][1])
        self.assertListEqual(order, list(config.keys()))

        self.assertEqual(config["name"]["type"], PLAYLIST_OPTIONS["name"][0])
        self.assertEqual(config["name"]["display"], PLAYLIST_OPTIONS["name"][1])
        self.assertEqual(len(config["name"]["values"]), 0)
        
    def test_006_search_playlists(self):

        cursor = self.conn.cursor()
        playlist_id = Playlist.create(cursor)

        name_search = self.build_playlist_search_params(match = [ { "name": "Untitled Playlist" } ])
        Search.search(cursor, "playlist", name_search)
        name_result = cursor.fetchall()
        self.assertEqual(len(name_result), 1)
        self.assertEqual(name_result[0].name, "Untitled Playlist")

        rating = Rating("playlist", playlist_id, 5)
        Playlist.set_rating(cursor, rating)

        rating_search = self.build_playlist_search_params(match = [ { "rating": 5 } ])
        Search.search(cursor, "playlist", rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 2)

        cursor.close()

    def test_007_track_search_config(self):

        cursor = self.conn.cursor()
        config = Search.configuration(cursor, "track")

        order = sorted(TRACK_OPTIONS, key = lambda k: TRACK_OPTIONS[k][1])
        self.assertListEqual(order, list(config.keys()))

        self.assertEqual(config["recording"]["type"], TRACK_OPTIONS["recording"][0])
        self.assertEqual(config["recording"]["display"], TRACK_OPTIONS["recording"][1])
        self.assertEqual(len(config["recording"]["values"]), 0)
        self.assertEqual(config["artist"]["type"], "text")
        self.assertListEqual(config["genre"]["values"], [ ])
        
        cursor.close()

    def test_008_search_tracks(self):

        cursor = self.conn.cursor()

        title_search = self.build_track_search_params(match = [ { "title": "The Plan" } ])
        Search.search(cursor, "track", title_search)
        title_results = cursor.fetchall()
        self.assertEqual(len(title_results), 1)

        recording_search = self.build_track_search_params(match = [ { "recording": "Keep It Like a Secret" } ])
        Search.search(cursor, "track", recording_search)
        recording_results = cursor.fetchall()
        self.assertEqual(len(recording_results), 3)

        for track in recording_results:
            Recording.set_track_rating(cursor, Rating("track", track.filename, 5))

        rating_search = self.build_track_search_params(match = [ { "rating": 5 } ])
        Search.search(cursor, "track", rating_search)
        rating_results = cursor.fetchall()
        self.assertEqual(len(rating_results), 3)

        recording_id = recording_results[0].recording_id
        recording = Recording.get(cursor, recording_id)
        recording.official = True
        Recording.update(cursor, recording.as_dict())

        official_search = self.build_track_search_params(nonofficial = False)
        Search.search(cursor, "track", official_search)
        official_results = cursor.fetchall()
        self.assertEqual(len(official_results), 3)

        unrated_search = self.build_track_search_params(unrated = True)
        Search.search(cursor, "track", unrated_search)
        unrated_results = cursor.fetchall()
        self.assertEqual(len(unrated_results), 6)

        artist_search = self.build_track_search_params(match = [ { "artist": "Built To Spill" } ])
        Search.search(cursor, "track", artist_search)
        artist_results = cursor.fetchall()
        self.assertEqual(len(artist_results), 3)

        exclude_search = self.build_track_search_params(exclude = [ { "artist": "Built To Spill" } ])
        Search.search(cursor, "track", exclude_search)
        exclude_results = cursor.fetchall()
        self.assertEqual(len(exclude_results), 6)

        cursor.close()

    def test_009_delete_playlist(self):

        cursor = self.conn.cursor()
        name_search = self.build_playlist_search_params(match = [ { "name": "Untitled Playlist" } ])
        Search.search(cursor, "playlist", name_search)
        name_result = cursor.fetchall()
        Playlist.delete(cursor, name_result[0].id)
        Playlist.get_all(cursor)
        playlists = cursor.fetchall()
        self.assertEqual(len(playlists), 1)
        cursor.close()
        

