import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date
from copy import deepcopy

from application.importer import DirectoryService
from application.library.station import Station, STATION_SEARCH_OPTIONS
from application.util.search import DEFAULT_QUERY
from application.library.rating_handler import Rating
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
        cls.default_query = DEFAULT_QUERY
        cls.default_query["sort"] = [ "name" ]

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
        config = Station.search_configuration(cursor)

        default_query = config["default_query"]
        self.assertEqual(default_query, self.default_query)

        search_options = config["search_options"]

        order = sorted(STATION_SEARCH_OPTIONS, key = lambda k: STATION_SEARCH_OPTIONS[k][1])
        self.assertListEqual(order, list(search_options.keys()))

        self.assertEqual(search_options["name"]["type"], STATION_SEARCH_OPTIONS["name"][0])
        self.assertEqual(search_options["name"]["display"], STATION_SEARCH_OPTIONS["name"][1])
        self.assertEqual(len(search_options["name"]["values"]), 0)
        cursor.close()
        
    def test_004_search_stations(self):

        cursor = self.conn.cursor()

        name_search = deepcopy(self.default_query)
        name_search["match"].append({ "name": "Bluegrass Country" })
        Station.search(cursor, name_search)
        name_result = [ row for row in cursor ]
        self.assertEqual(len(name_result), 1)
        self.assertEqual(name_result[0].name, "Bluegrass Country")

        rating_search = deepcopy(self.default_query)
        rating_search["match"].append({ "rating": 5 })
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

