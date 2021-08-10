from uuid import uuid4
from datetime import datetime
from dateutil.parser import parse as parsedate
from lxml import etree
import requests
import logging

from .db import Column, Query
from .db import Table, JoinedView, ItemTable, ItemCreator, Search

logger = logging.getLogger("tornado.application")

class PodcastTable(Table, ItemTable, ItemCreator):

    name = "podcast"
    columns = [
        Column("id", "text", False, True),
        Column("name", "text", True, True),
        Column("rss", "text", True, False),
        Column("website", "text", True, False),
        Column("rating", "int", False, True),
        Column("added_date", "date", False, False),
    ]
    identifier_col = "id"
    item_type      = "Podcast"

    @classmethod
    def create(cls, cursor, podcast):

        podcast["id"] = str(uuid4())
        podcast["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
        cls.insert(cursor, podcast)
        return podcast["id"]

    @classmethod
    def delete(cls, cursor, podcast_id):

        super().delete(cursor, podcast_id)
        PodcastEpisodeTable.delete_where(cursor, { "id": podcast_id })

class PodcastEpisodeTable(Table, ItemTable, ItemCreator):

    name = "podcast_episode"
    columns = [
        Column("id", "text", False, True),
        Column("podcast_id", "text", False, True),
        Column("url", "text", False, False),
        Column("title", "text", False, True),
        Column("date_published", "date", False, True),
        Column("description", "text", False, False),
        Column("listened_date", "date", False, False),
    ]
    identifier_col = "id"
    item_type      = "PodcastEpisode"

    @classmethod
    def update_history(cls, cursor, entry):

        stmt = "update podcast_episode set listened_date=? where url=?"
        values = (datetime.utcnow().strftime("%Y-%m-%d"), entry.info["url"])
        cursor.execute(stmt, values)

    @classmethod
    def set_listened(cls, cursor, episode_id):

        stmt = "update podcast_episode set listened_date=? where id=?"
        values = (datetime.utcnow().strftime("%Y-%m-%d"), episode_id)
        cursor.execute(stmt, values)

class PodcastSearchView(JoinedView, ItemCreator):

    name = "podcast_search"
    subqueries = (
        Query(PodcastTable, [
            ("podcast_id", "id"),
            ("podcast_name", "name"),
            ("website", None),
            ("rating", None) 
        ]),
        Query(PodcastEpisodeTable, [
            ("podcast_id", None),
            ("url", None),
            ("episode_title", "title"),
            ("date_published", None),
            ("description", None),
            ("listened_date", None),
        ])
    )
    item_type = "PodcastEpisodeDetail"

    @classmethod
    def from_url(cls, cursor, url):

        cursor.row_factory = cls.row_factory
        cursor.execute("select * from podcast_search where url=?", (url, ))
        return cursor.fetchone()

class PodcastSummaryView(JoinedView, ItemCreator, Search):

    name = "podcast_summary"
    subqueries = (
        Query(PodcastTable, [
            ("id", None),
            ("name", None),
            ("website", None),
            ("rss", None),
            ("rating", None) 
        ]),
        Query(PodcastSearchView, [
            ("id", "podcast_id"),
            ("episodes", "count(episode_title)"),
            ("unlistened", "sum(listened_date is null)"),
            ("date_published", "max(date_published)"),
        ], group = "podcast_id")
    )
    identifier_col = "id"
    item_type      = "PodcastSummary"

    search_options = {
        "name": ("text", "Name"),
        "rating": ("rating", "Minimum Rating"),
        "date_published": ("standard_date", "Published Since"),
    }
    search_checkboxes   = { "unrated": "Unrated Only" }
    search_sort_columns = [ "name" ]
    search_source       = PodcastSearchView
    search_column       = "podcast_id"

    @classmethod
    def get_episodes(cls, cursor, podcast_id, listened, get_all):

        query = Query(PodcastEpisodeTable, 
            order = "date_published desc",
            limit = None if get_all else 5
        ).compare("podcast_id", podcast_id, "=")
        if not listened:
            query.compare("listened_date", None, "is")
        query.execute(cursor, PodcastEpisodeTable.row_factory)

    @classmethod
    def update_episodes(cls, cursor, podcast_id):

        Query(cls, [ ("rss", None) ]).compare("id", podcast_id, "=").execute(cursor)
        rss = cursor.fetchone()[0]

        resp = requests.get(rss)
        resp.raise_for_status()
        content = etree.fromstring(resp.content)

        query = Query(PodcastEpisodeTable, [ ("url", None) ]).compare("podcast_id", podcast_id, "=")
        query.execute(cursor)
        unavailable = [ row["url"] for row in cursor.fetchall() ]

        for item in content.xpath(".//item"):
            try:
                episode = {
                    "id": str(uuid4()),
                    "podcast_id": podcast_id,
                    "url": item.find("./enclosure").attrib["url"],
                    "title": item.find("./title").text,
                    "date_published": parsedate(item.find("./pubDate").text).strftime("%Y-%m-%d"),
                    "description": item.find("./description").text,
                }
                if episode["url"] not in unavailable:
                    PodcastEpisodeTable.insert(cursor, episode)
                else:
                    unavailable.remove(episode["url"])
            except:
                logger.error(f"Error retrieving episode for {podcast_id}", exc_info = True)
                continue

        urls = ", ".join([ f"'{url}'" for url in unavailable ])
        stmt = f"delete from podcast_episode where podcast_id=? and url in ({urls})"
        cursor.execute(stmt, (podcast_id, ))
        cursor.execute("select * from podcast_summary where id=?", (podcast_id, ))
        return cursor.fetchone()

