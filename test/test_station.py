import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date

from application.importer import DirectoryService
from application.library.station import Station
from application.library.rating_handler import Rating
from application.library.search import Search, STATION_OPTIONS
from application.config import TABLES, VIEWS
from . import ROOT_PATH, DEFAULT_INDEX, DB_NAME

class TestStation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

        cls.conn = sqlite3.connect(DB_NAME, detect_types = sqlite3.PARSE_DECLTYPES)
        cls.stations = [
            { "name": "Viva la Voce", "website": "", "url": "https://16803.live.streamtheworld.com/WETAVLV.mp3" },
            { "name": "Bluegrass Country", "website": "https://bluegrasscountry.org", "url": "https://ice24.securenetsystems.net/WAMU" },
        ]

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
        cursor.close()

    def build_search_params(self, **params):

        return { 
            "match": params.get("match", [ ]),
            "exclude": params.get("exclude", [ ]),
        }

    def test_001_create_station(self):

        cursor = self.conn.cursor()
        Station.create(cursor, self.stations[0])
        Station.create(cursor, self.stations[1])
        Station.get_all(cursor)
        stations = [ row for row in cursor ]
        for idx, station in enumerate(stations):
            self.stations[idx]["id"] = station.id
        self.assertEqual(len(stations), 2)
        self.assertEqual(stations[0].name, self.stations[0]["name"])
        self.assertEqual(stations[0].website, None)
        cursor.close()

    def test_002_update_station(self):

        cursor = self.conn.cursor()
        self.stations[0]["website"] = "https://weta.org/fm"
        Station.update(cursor, self.stations[0])
        rating = Rating("station", self.stations[1]["id"], 5)
        Station.set_rating(cursor, rating)
        Station.get_all(cursor)
        stations = [ row for row in cursor ]
        self.assertEqual(stations[0].website, "https://weta.org/fm")
        self.assertEqual(stations[1].rating, 5)
        cursor.close()

    def test_003_search_config(self):

        cursor = self.conn.cursor()
        config = Search.configuration(cursor, "station")

        order = sorted(STATION_OPTIONS, key = lambda k: STATION_OPTIONS[k][1])
        self.assertListEqual(order, list(config.keys()))

        self.assertEqual(config["name"]["type"], STATION_OPTIONS["name"][0])
        self.assertEqual(config["name"]["display"], STATION_OPTIONS["name"][1])
        self.assertEqual(len(config["name"]["values"]), 0)
        cursor.close()
        
    def test_004_search_stations(self):

        cursor = self.conn.cursor()

        name_search = self.build_search_params(match = [ { "name": "Bluegrass Country" } ])
        Search.search(cursor, "station", name_search)
        name_result = [ row for row in cursor ]
        self.assertEqual(len(name_result), 1)
        self.assertEqual(name_result[0].name, "Bluegrass Country")

        rating_search = self.build_search_params(match = [ { "rating": 5 } ])
        rating_result = [ row for row in cursor ]
        self.assertEqual(len(name_result), 1)
        self.assertEqual(name_result[0].name, "Bluegrass Country")

        cursor.close()

    def test_005_delete_station(self):

        cursor = self.conn.cursor()
        Station.delete(cursor, self.stations[1]["id"])
        Station.get_all(cursor)
        stations = [ row for row in cursor ]
        self.assertEqual(len(stations), 1)
        cursor.close()

