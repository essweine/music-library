import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date

from application.importer import DirectoryService
from application.library import Recording, Playlist, PlaylistTrack
from application.library.rating_handler import Rating
from application.library.search import Search
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

        playlist = Playlist(**{ })
        playlist.name = "Test Playlist"
        files = [
            self.get_filename(self.kilas, 0),
            self.get_filename(self.edge, 0),
        ]
        playlist.files = files

        cursor = self.conn.cursor()
        Playlist.create(cursor, playlist.as_dict())
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

        self.assertEqual(playlist.name, "Test Playlist")
        self.assertEqual(len(playlist.files), 2)
        self.assertEqual(playlist.files[0].filename, self.get_filename(self.kilas, 0))

        cursor.close()

    def test_004_update_playlist(self):

        cursor = self.conn.cursor()

        Playlist.get_all(cursor)
        playlists = cursor.fetchall()
        playlist = Playlist.get(cursor, playlists[0].id)
        playlist.name = "Updated Playlist"
        files = [
            self.get_filename(self.kilas, 1),
            self.get_filename(self.edge, 1),
        ]
        playlist.files = files

        Playlist.update(cursor, playlist.as_dict())
        rating = Rating("playlist", playlist.id, 5)
        Playlist.set_rating(cursor, rating)

        playlist = Playlist.get(cursor, playlists[0].id)
        self.assertEqual(playlist.name, "Updated Playlist")
        self.assertEqual(len(playlist.files), 2)
        self.assertEqual(playlist.files[0].filename, files[0])
        self.assertEqual(playlist.rating, 5)

        cursor.close()

    def test_005_search_playlists(self):

        playlist = Playlist(**{ })
        playlist.name = "New Playlist"
        files = [
            self.get_filename(self.kilas, 0),
            self.get_filename(self.edge, 0),
        ]
        playlist.files = files

        cursor = self.conn.cursor()
        Playlist.create(cursor, playlist.as_dict())

        name_search = self.build_playlist_search_params(match = [ { "name": playlist.name } ])
        Search.playlist(cursor, name_search)
        name_result = cursor.fetchall()
        self.assertEqual(len(name_result), 1)
        self.assertEqual(name_result[0].name, playlist.name)

        rating = Rating("playlist", name_result[0].id, 5)
        Playlist.set_rating(cursor, rating)

        rating_search = self.build_playlist_search_params(match = [ { "rating": 5 } ])
        Search.playlist(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 2)

        cursor.close()

    def test_006_search_tracks(self):

        cursor = self.conn.cursor()

        title_search = self.build_track_search_params(match = [ { "title": "The Plan" } ])
        Search.track(cursor, title_search)
        title_results = cursor.fetchall()
        self.assertEqual(len(title_results), 1)

        recording_search = self.build_track_search_params(match = [ { "recording": "Keep It Like a Secret" } ])
        Search.track(cursor, recording_search)
        recording_results = cursor.fetchall()
        self.assertEqual(len(recording_results), 3)

        for track in recording_results:
            Recording.set_track_rating(cursor, Rating("track", track.filename, 5))

        rating_search = self.build_track_search_params(match = [ { "rating": 5 } ])
        Search.track(cursor, rating_search)
        rating_results = cursor.fetchall()
        self.assertEqual(len(rating_results), 3)

        recording_id = recording_results[0].recording_id
        recording = Recording.get(cursor, recording_id)
        recording.official = True
        Recording.update(cursor, recording.as_dict())

        official_search = self.build_track_search_params(nonofficial = False)
        Search.track(cursor, official_search)
        official_results = cursor.fetchall()
        self.assertEqual(len(official_results), 3)

        unrated_search = self.build_track_search_params(unrated = True)
        Search.track(cursor, unrated_search)
        unrated_results = cursor.fetchall()
        self.assertEqual(len(unrated_results), 6)

        artist_search = self.build_track_search_params(match = [ { "artist": "Built To Spill" } ])
        Search.track(cursor, artist_search)
        artist_results = cursor.fetchall()
        self.assertEqual(len(artist_results), 3)

        exclude_search = self.build_track_search_params(exclude = [ { "artist": "Built To Spill" } ])
        Search.track(cursor, exclude_search)
        exclude_results = cursor.fetchall()
        self.assertEqual(len(exclude_results), 6)

        cursor.close()

    def test_007_delete_playlist(self):

        cursor = self.conn.cursor()
        name_search = self.build_playlist_search_params(match = [ { "name": "Updated Playlist" } ])
        Search.playlist(cursor, name_search)
        name_result = cursor.fetchall()
        Playlist.delete(cursor, name_result[0].id)
        Playlist.get_all(cursor)
        playlists = cursor.fetchall()
        self.assertEqual(len(playlists), 1)
        cursor.close()
        

