import unittest
import sqlite3
import os
import re

from datetime import date
from copy import deepcopy

from application.library import TABLES, VIEWS
from application.importer import DirectoryService
from application.library import RecordingTable, TrackTable, RecordingSummaryView, LibrarySearchView
from application.library.rating_handler import Rating
from application.library.db.search import DEFAULT_QUERY
from . import ROOT_PATH, DEFAULT_INDEX, DB_NAME

class TestRecording(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

        cls.conn = sqlite3.connect(DB_NAME, detect_types = sqlite3.PARSE_DECLTYPES)
        cls.default_query = DEFAULT_QUERY
        cls.default_query["sort"] = [ "artist", "recording_date" ]

    @classmethod
    def tearDownClass(cls):

        cls.conn.close()
        os.remove(DB_NAME)

    def setUp(self):

        self.directory_service = DirectoryService(ROOT_PATH, DEFAULT_INDEX)

    def test_001_initialize_tables(self):

        cursor = self.conn.cursor()
        for item in TABLES + VIEWS:
            item.initialize(cursor)
        self.conn.commit()
        cursor.close()

    def test_002_insert_recording(self):

        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        cursor = self.conn.cursor()
        LibrarySearchView.create_recording(cursor, recording.serialize())
        cursor.close()

    def test_003_get_summaries(self):

        cursor = self.conn.cursor()
        cursor.execute("select distinct * from recording_summary")
        RecordingSummaryView.get_all(cursor)
        summaries = cursor.fetchall()
        self.assertEqual(len(summaries), 1)
        first = summaries[0]
        self.assertEqual(first.title, "Keep It Like a Secret")
        cursor.close()

    def test_004_get_recording(self):

        cursor = self.conn.cursor()
        RecordingSummaryView.get_all(cursor)
        recording_id = cursor.fetchall()[0].id
        recording = LibrarySearchView.get_recording(cursor, recording_id)
        self.assertEqual(len(recording.tracks), 3)
        self.assertEqual(recording.tracks[0].artist[0], "Built to Spill")
        self.assertEqual(recording.tracks[0].title, "The Plan")
        self.assertEqual(recording.recording_date, date(1999, 2, 2))
        cursor.close()

    def test_005_update_recording(self):

        cursor = self.conn.cursor()
        RecordingSummaryView.get_all(cursor)
        recording_id = cursor.fetchall()[0].id
        recording = LibrarySearchView.get_recording(cursor, recording_id)
        for track in recording.tracks:
            track.artist[0] = "Built To Spill"
            track.genre.append("Rock")
        LibrarySearchView.update_recording(cursor, recording.serialize())

        album_rating = Rating("recording-rating", recording_id, 5)
        track_rating = Rating("track", recording.tracks[0].filename, 5)
        RecordingTable.set_rating(cursor, album_rating)
        TrackTable.set_rating(cursor, track_rating)

        updated = LibrarySearchView.get_recording(cursor, recording_id)
        self.assertEqual(updated.tracks[0].artist[0], "Built To Spill")
        self.assertEqual(updated.rating, 5)
        self.assertEqual(updated.tracks[0].rating, 5)
        cursor.close()

    def test_006_validate_recording(self):

        cursor = self.conn.cursor()
        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        cursor.close()

        validation = LibrarySearchView.validate(recording.serialize())
        self.assertEqual(len(validation), 0)

        recording.recording_date = None
        validation = LibrarySearchView.validate(recording.serialize())
        self.assertEqual(len(validation), 0)

        recording.recording_date = "Unparseable date"
        validation = LibrarySearchView.validate(recording.serialize())
        self.assertEqual(len(validation), 1)
        self.assertRegex(validation[0], "Invalid date")

    def test_007_search_config(self):

        cursor = self.conn.cursor()
        config = RecordingSummaryView.search_configuration(cursor)

        default_query = config["default_query"]
        self.assertEqual(default_query, self.default_query)

        search_options = config["search_options"]

        order = sorted(RecordingSummaryView.search_options, key = lambda k: RecordingSummaryView.search_options[k][1])
        self.assertListEqual(order, list(search_options.keys()))

        self.assertEqual(search_options["recording"]["type"], RecordingSummaryView.search_options["recording"][0])
        self.assertEqual(search_options["recording"]["display"], RecordingSummaryView.search_options["recording"][1])
        self.assertEqual(len(search_options["recording"]["values"]), 0)
        self.assertEqual(search_options["artist"]["type"], "text")
        self.assertListEqual(search_options["genre"]["values"], [ "Rock" ])
        
        cursor.close()

    def test_008_search(self):

        cursor = self.conn.cursor()
        directory = self.directory_service.get_directory("root/Edge of the Sun")
        self.directory_service.aggregate(directory)
        recording = self.directory_service.create_recording(directory, directory.text[0])
        recording.official = True
        LibrarySearchView.create_recording(cursor, recording.serialize())
        album_rating = Rating("recording-rating", recording.id, 5)
        RecordingTable.set_rating(cursor, album_rating)

        artist_search = deepcopy(self.default_query)
        artist_search["match"].append({ "artist": "Built To Spill" })
        RecordingSummaryView.search(cursor, artist_search)
        artist_result = cursor.fetchall()
        self.assertEqual(len(artist_result), 1)

        title_search = deepcopy(self.default_query)
        title_search["match"].append({ "recording": "Keep It Like A Secret" })
        RecordingSummaryView.search(cursor, title_search)
        title_result = cursor.fetchall()
        self.assertEqual(len(title_result), 1)

        track_search = deepcopy(self.default_query)
        track_search["match"].append({ "title": "Carry the Zero" })
        RecordingSummaryView.search(cursor, track_search)
        track_result = cursor.fetchall()
        self.assertEqual(len(track_result), 1)

        rating_search = deepcopy(self.default_query)
        rating_search["match"].append({ "recording_rating": 5 })
        RecordingSummaryView.search(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 1)

        exclude_artist = deepcopy(self.default_query)
        exclude_artist["exclude"].append({ "artist": "Calexico" })
        RecordingSummaryView.search(cursor, exclude_artist)
        exclude_artist_result = cursor.fetchall()
        self.assertEqual(len(exclude_artist_result), 1)

        rating_search = deepcopy(self.default_query)
        rating_search["exclude"].append({ "recording_rating": 3 })
        RecordingSummaryView.search(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 1)

        rating_search = deepcopy(self.default_query)
        rating_search["unrated"] = True
        RecordingSummaryView.search(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 2)

        cursor.close()

    def test_009_search_date(self):

        cursor = self.conn.cursor()
        RecordingSummaryView.get_all(cursor)
        recording_id = cursor.fetchall()[0].id
        recording = LibrarySearchView.get_recording(cursor, recording_id)

        exact_date = date.strftime(recording.recording_date, "%Y-%m-%d")
        any_year = date.strftime(recording.recording_date, "*-%m-%d")
        partial_year = re.sub("19", "*", date.strftime(recording.recording_date, "%Y-%m-%d"))
        year_and_month = date.strftime(recording.recording_date, "%Y-%m-*")

        search = deepcopy(self.default_query)
        search["match"].append({ "recording_date": exact_date })
        RecordingSummaryView.search(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        search["match"][0]["recording_date"] = any_year
        RecordingSummaryView.search(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        search["match"][0]["recording_date"] = partial_year
        RecordingSummaryView.search(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        search["match"][0]["recording_date"] = year_and_month
        RecordingSummaryView.search(cursor, search)
        result = cursor.fetchall()
        self.assertEqual(len(result), 1)

        cursor.close()

    def test_010_sort(self):

        cursor = self.conn.cursor()

        RecordingSummaryView.get_all(cursor, "artist")
        summaries = cursor.fetchall()
        first = summaries[0]
        self.assertEqual(len(summaries), 2)
        self.assertEqual(first.title, "Keep It Like a Secret")

        search = deepcopy(self.default_query)
        search["sort"] = [ "title" ]
        RecordingSummaryView.search(cursor, search)
        result = cursor.fetchall()
        first = result[0]
        self.assertEqual(len(result), 2)
        self.assertEqual(first.title, "Edge of the Sun")

        search["order"] = "desc"
        RecordingSummaryView.search(cursor, search)
        result = cursor.fetchall()
        first = result[0]
        self.assertEqual(first.title, "Keep It Like a Secret")

        cursor.close()

