import unittest
import sqlite3
import os

from uuid import uuid4
from datetime import date
from copy import deepcopy

from lxml import etree
from requests_mock import Mocker

from application.library import TABLES, VIEWS
from application.importer import DirectoryService
from application.library.podcast import PodcastSummaryView, PodcastTable, PodcastEpisodeTable
from application.library.db.search import DEFAULT_QUERY
from application.library.rating_handler import Rating
from application.player.playlist import StreamEntry
from . import ROOT_PATH, DEFAULT_INDEX, DB_NAME

class TestPodcast(unittest.TestCase):

    @classmethod
    def setUpClass(cls):

        cls.conn = sqlite3.connect(DB_NAME, detect_types = sqlite3.PARSE_DECLTYPES)
        cls.default_query = DEFAULT_QUERY
        cls.podcasts = [
            {
                "name": "The Lawfare Podcast",
                "website": None,
                "rss": "http://lawfare.libsyn.com/rss",
            },
            {
                "name": "We The People",
                "website": "https://constitutioncenter.org/debate/podcasts",
                "rss": "https://feeds.megaphone.fm/PP6268765043",
            }
        ]
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

    def test_001_create_podcast(self):

        cursor = self.conn.cursor()
        PodcastTable.create(cursor, self.podcasts[0])
        PodcastTable.create(cursor, self.podcasts[1])
        PodcastTable.get_all(cursor)
        podcasts = [ row for row in cursor ]
        for idx, podcast in enumerate(podcasts):
            self.podcasts[idx]["id"] = podcast.id
        self.assertEqual(len(podcasts), 2)
        self.assertEqual(podcasts[0].name, self.podcasts[0]["name"])
        self.assertEqual(podcasts[0].website, self.podcasts[0]["website"])
        cursor.close()

    def test_002_update_podcast(self):

        cursor = self.conn.cursor()
        self.podcasts[0]["website"] = "https://www.lawfareblog.com/topic/lawfare-podcast"
        PodcastTable.update(cursor, self.podcasts[0])
        rating = Rating("podcast", self.podcasts[1]["id"], 5)
        PodcastTable.set_rating(cursor, rating)
        PodcastTable.get_all(cursor)
        podcasts = [ row for row in cursor ]
        self.assertEqual(podcasts[0].website, "https://www.lawfareblog.com/topic/lawfare-podcast")
        self.assertEqual(podcasts[1].rating, 5)
        cursor.close()

    def test_003_update_episodes(self):

        cursor = self.conn.cursor()
        rss = etree.parse("test/data/podcast.rss")
        with Mocker() as mock:
            mock.get(self.podcasts[0]["rss"], content = etree.tostring(rss))
            PodcastSummaryView.update_episodes(cursor, self.podcasts[0]["id"])
        PodcastSummaryView.get_episodes(cursor, self.podcasts[0]["id"], True, True)
        episodes = cursor.fetchall()

        self.assertEqual(len(episodes), 100)
        self.assertEqual(episodes[0].podcast_id, self.podcasts[0]["id"])
        self.assertEqual(episodes[0].title, "The Least Dangerous Branch \u2026 of Facebook")
        self.assertEqual(episodes[0].date_published, date(2021, 1, 29))

        for i in range(5):
            entry = StreamEntry(episodes[i].url)
            PodcastEpisodeTable.update_history(cursor, entry)
        cursor.close()

    def test_004_search_podcasts(self):

        cursor = self.conn.cursor()

        name_search = deepcopy(self.default_query)
        name_search["match"].append({ "name": "The Lawfare Podcast" })
        PodcastSummaryView.search(cursor, name_search)
        name_result = cursor.fetchall()
        self.assertEqual(len(name_result), 1)
        self.assertEqual(name_result[0].name, "The Lawfare Podcast")

        rating_search = deepcopy(self.default_query)
        rating_search["match"].append({ "rating": 3 })
        PodcastSummaryView.search(cursor, rating_search)
        rating_result = cursor.fetchall()
        self.assertEqual(len(rating_result), 1)
        self.assertEqual(rating_result[0].name, "We The People")

        cursor.close()

    def test_005_filter_episodes(self):

        cursor = self.conn.cursor()
        PodcastSummaryView.get_all(cursor, "name")
        podcasts = cursor.fetchall()
        self.assertEqual(podcasts[0].episodes, 100)
        self.assertEqual(podcasts[0].unlistened, 95)
        PodcastSummaryView.get_episodes(cursor, self.podcasts[0]["id"], False, False)
        episodes = cursor.fetchall()
        self.assertEqual(len(episodes), 5)
        self.assertNotEqual(episodes[0].title, "The Least Dangerous Branch \u2026 of Facebook")
        cursor.close()

    def test_006_delete_podcast(self):

        cursor = self.conn.cursor()
        PodcastTable.delete(cursor, self.podcasts[1]["id"])
        PodcastTable.get_all(cursor)
        podcasts = [ row for row in cursor ]
        self.assertEqual(len(podcasts), 1)
        cursor.close()

