import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date

from application.importer import DirectoryService
from application.library import Recording
from application.config import TABLE_DEFS
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

    def test_001_initialize_tables(self):

        cursor = self.conn.cursor()
        for stmt in TABLE_DEFS:
            cursor.execute(stmt)
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
        Recording.get_summaries(cursor)
        summaries = [ row for row in cursor ]
        self.assertEqual(len(summaries), 1)
        first = summaries[0]
        self.assertEqual(first.id, self.recording_id)
        self.assertEqual(first.title, "Keep It Like a Secret")
        self.assertEqual(len(first.tracks), 0)
        cursor.close()

    def test_004_get_recording(self):

        cursor = self.conn.cursor()
        recording = Recording.get(cursor, self.recording_id)
        self.assertEqual(recording.artist, "Built to Spill")
        self.assertEqual(len(recording.tracks), 3)
        self.assertEqual(recording.tracks[0].title, "The Plan")
        self.assertEqual(recording.recording_date, date(1999, 2, 2))
        cursor.close()

    def test_005_update_recording(self):

        cursor = self.conn.cursor()
        recording = Recording.get(cursor, self.recording_id)
        recording.artist = "Built To Spill"
        Recording.update(cursor, recording.as_dict())

        album_rating = { "item": "rating", "rating": 5 }
        track_rating = { "item": recording.tracks[0].filename, "rating": 5 }
        Recording.set_rating(cursor, self.recording_id, album_rating)
        Recording.set_rating(cursor, self.recording_id, track_rating)

        updated = Recording.get(cursor, self.recording_id)
        self.assertEqual(updated.artist, "Built To Spill")
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
        Recording.create(cursor, recording.as_dict())
        album_rating = { "item": "rating", "rating": 5 }
        Recording.set_rating(cursor, recording.id, album_rating)

        artist_search = { "match": [ { "artist": "Built To Spill" } ], "exclude": [ ] }
        Recording.search(cursor, artist_search)
        artist_result = [ row for row in cursor ]
        self.assertEqual(len(artist_result), 1)
        self.assertEqual(artist_result[0].id, self.recording_id)

        title_search = { "match": [ { "track_title": "Carry the Zero" } ], "exclude": [ ] }
        Recording.search(cursor, title_search)
        title_result = [ row for row in cursor ]
        self.assertEqual(len(title_result), 1)
        self.assertEqual(title_result[0].id, self.recording_id)

        rating_search = { "match": [ { "rating": 5 } ], "exclude": [ ] }
        Recording.search(cursor, rating_search)
        rating_result = [ row for row in cursor ]
        self.assertEqual(len(rating_result), 2)

        exclude_artist = { "match": [ ], "exclude": [ { "artist": "Calexico" } ] }
        Recording.search(cursor, exclude_artist)
        exclude_artist_result = [ row for row in cursor ]
        self.assertEqual(len(exclude_artist_result), 1)
        self.assertEqual(artist_result[0].id, self.recording_id)

        rating_search = { "match": [ ], "exclude": [ { "rating": 3 } ] }
        Recording.search(cursor, rating_search)
        rating_result = [ row for row in cursor ]
        self.assertEqual(len(rating_result), 0)

        cursor.close()

