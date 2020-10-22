import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date

from application.importer import DirectoryService
from application.library import Recording
from application.library.search import Search, RECORDING_OPTIONS
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
        cursor = self.conn.cursor()
        for item in TABLES + VIEWS:
            item.initialize(cursor)
        self.conn.commit()

        directory = self.directory_service.get_directory("root/Keep It Like A Secret")
        recording = self.directory_service.create_recording(directory, directory.text[0])
        recording.id = self.recording_id
        for track in recording.tracks:
            track.genre.append("Rock")
        cursor = self.conn.cursor()
        Recording.create(cursor, recording.as_dict())

        cursor.close()

    def test_001_get_config(self):

        cursor = self.conn.cursor()
        config = Search.configuration(cursor, "recording")

        order = sorted(RECORDING_OPTIONS, key = lambda k: RECORDING_OPTIONS[k][1])
        self.assertListEqual(order, list(config.keys()))

        self.assertEqual(config["recording"]["type"], RECORDING_OPTIONS["recording"][0])
        self.assertEqual(config["recording"]["display"], RECORDING_OPTIONS["recording"][1])
        self.assertEqual(len(config["recording"]["values"]), 0)
        self.assertEqual(config["artist"]["type"], "text")
        self.assertListEqual(config["genre"]["values"], [ "Rock" ])
        
        cursor.close()

