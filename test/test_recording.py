import unittest
import sqlite3
import os
import re

from uuid import uuid4
from datetime import date

from application.importer import DirectoryService
from application.library import Recording, RecordingSummary
from application.library.rating_handler import Rating
from application.library.search import Search
from application.config import TABLES, VIEWS
from . import ROOT_PATH, DEFAULT_INDEX, DB_NAME

class TestRecording(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

        cls.conn = sqlite3.connect(DB_NAME, detect_types = sqlite3.PARSE_DECLTYPES)
        cls.recording_id = str(uuid4())

    @classmethod
    def tearDownClass(cls):

        cls.conn.close()
        os.remove(DB_NAME)

    def setUp(self):

        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX)

    def build_search_params(self, **params):

        return { 
            "match": params.get("match", [ ]),
            "exclude": params.get("exclude", [ ]),
            "official": params.get("official", True),
            "nonofficial": params.get("nonofficial", True),
            "unrated": params.get("unrated", False),
        }

    def test_001_initialize_tables(self):

        cursor = self.conn.cursor()
        for item in TABLES + VIEWS:
            item.initialize(cursor)
        self.conn.commit()
        cursor.close()

    def test_002_insert_recording(self):

        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        recording.id = self.recording_id
        cursor = self.conn.cursor()
        Recording.create(cursor, recording.as_dict())
        cursor.close()

    def test_003_get_summaries(self):

        cursor = self.conn.cursor()
        RecordingSummary.get_all(cursor)
        summaries = cursor.fetchall()
        self.assertEqual(len(summaries), 1)
        first = summaries[0]
        self.assertEqual(first.id, self.recording_id)
        self.assertEqual(first.title, "Keep It Like a Secret")
        cursor.close()

    def test_004_get_recording(self):

        cursor = self.conn.cursor()
        recording = Recording.get(cursor, self.recording_id)
        self.assertEqual(recording.artist[0], "Built to Spill")
        self.assertEqual(len(recording.tracks), 3)
        self.assertEqual(recording.tracks[0].title, "The Plan")
        self.assertEqual(recording.recording_date, date(1999, 2, 2))
        cursor.close()

    def test_005_update_recording(self):

        cursor = self.conn.cursor()
        recording = Recording.get(cursor, self.recording_id)
        for track in recording.tracks:
            track.artist.append("Built To Spill")
        Recording.update(cursor, recording.as_dict())

        album_rating = Rating("recording", self.recording_id, "rating", 5)
        track_rating = Rating("recording", self.recording_id, recording.tracks[0].filename, 5)
        Recording.set_rating(cursor, album_rating)
        Recording.set_rating(cursor, track_rating)

        updated = Recording.get(cursor, self.recording_id)
        self.assertEqual(updated.artist[0], "Built To Spill")
        self.assertEqual(updated.rating, 5)
        self.assertEqual(updated.tracks[0].rating, 5)
        cursor.close()

    def test_006_validate_recording(self):

        cursor = self.conn.cursor()
        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        cursor.close()

        validation = Recording.validate(recording.as_dict())
        self.assertEqual(len(validation), 0)

        recording.recording_date = None
        validation = Recording.validate(recording.as_dict())
        self.assertEqual(len(validation), 0)

        recording.recording_date = "Unparseable date"
        validation = Recording.validate(recording.as_dict())
        self.assertEqual(len(validation), 1)
        self.assertRegex(validation[0], "Invalid date")

    def test_008_search(self):

        cursor = self.conn.cursor()
        directory = self.directory_service.get_directory("root/Edge of the Sun")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        recording.official = True
        Recording.create(cursor, recording.as_dict())
        album_rating = Rating("recording", recording.id, "rating", 5)
        Recording.set_rating(cursor, album_rating)

        artist_search = self.build_search_params(match = [ { "artist": "Built To Spill" } ])
        Search.recording(cursor, artist_search)
        artist_result = cursor.fetchall()
        self.assertEqual(len(artist_result), 1)
        self.assertEqual(artist_result[0].id, self.recording_id)

        title_search = self.build_search_params(match = [ { "recording": "Keep It Like A Secret" } ])
        Search.recording(cursor, title_search)
        title_result = cursor.fetchall()
        self.assertEqual(len(title_result), 1)
        self.assertEqual(title_result[0].id, self.recording_id)

        track_search = self.build_search_params(match = [ { "title": "Carry the Zero" } ])
        Search.recording(cursor, track_search)
        track_result = cursor.fetchall()
        self.assertEqual(len(track_result), 1)
        self.assertEqual(track_result[0].id, self.recording_id)

        rating_search = self.build_search_params(match = [ { "recording_rating": 5 } ])
        Search.recording(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 1)

        exclude_artist = self.build_search_params(exclude = [ { "artist": "Calexico" } ])
        Search.recording(cursor, exclude_artist)
        exclude_artist_result = cursor.fetchall()
        self.assertEqual(len(exclude_artist_result), 1)
        self.assertEqual(artist_result[0].id, self.recording_id)

        rating_search = self.build_search_params(exclude = [ { "recording_rating": 3 } ])
        Search.recording(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 0)

        rating_search = self.build_search_params(unrated = True)
        Search.recording(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 0)

        cursor.close()

    def test_009_search_date(self):

        cursor = self.conn.cursor()
        recording = Recording.get(cursor, self.recording_id)

        exact_date = date.strftime(recording.recording_date, "%Y-%m-%d")
        any_year = date.strftime(recording.recording_date, "*-%m-%d")
        partial_year = re.sub("19", "*", date.strftime(recording.recording_date, "%Y-%m-%d"))
        year_and_month = date.strftime(recording.recording_date, "%Y-%m-*")

        search = self.build_search_params(match = [ { "recording_date": exact_date } ])
        Search.recording(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        search["match"][0]["recording_date"] = any_year
        Search.recording(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        search["match"][0]["recording_date"] = partial_year
        Search.recording(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        search["match"][0]["recording_date"] = year_and_month
        Search.recording(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        cursor.close()

