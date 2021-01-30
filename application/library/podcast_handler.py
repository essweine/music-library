import sys
import json

from .podcast import PodcastTable, PodcastSummaryView
from ..util import BaseApiHandler, BaseSearchHandler

class PodcastRootHandler(BaseApiHandler):

    def get(self):

        try:
            podcasts = self.db_query(PodcastSummaryView.get_all, "name")
            self.write(json.dumps(podcasts, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not get podcast list", exc_info = sys.exc_info())

    def post(self):

        try:
            podcast_id = self.db_action(PodcastTable.create, self.json_body)
            self.write(json.dumps({ "id": podcast_id }))
        except:
            self.write_error(500, log_message = f"Could not create podcast", exc_info = sys.exc_info())

class PodcastSearchHandler(BaseSearchHandler):

    SearchType = "podcast"

    def get_configuration(self):
        return self.db_action(PodcastSummaryView.search_configuration)

    def search(self):
        return self.db_query(PodcastSummaryView.search, self.json_body)

class PodcastHandler(BaseApiHandler):

    def get(self, podcast_id):

        try:
            podcast = self.db_action(PodcastTable.get, podcast_id)
            if podcast is not None:
                self.write(json.dumps(podcast, cls = self.JsonEncoder))
            else:
                self.write_error(404, messages = [ f"Podcast not found: {podcast_id}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get podcast {podcast_id}", exc_info = sys.exc_info())

    def put(self, podcast_id):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])
        try:
            self.db_action(PodcastTable.update, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not update podcast {podcast_id}", exc_info = sys.exc_info())

    def delete(self, podcast_id):

        try:
            self.db_action(PodcastTable.delete, podcast_id)
        except:
            self.write_error(500, log_message = f"Could not delete podcast {podcast_id}", exc_info = sys.exc_info())

class PodcastEpisodeRootHandler(BaseApiHandler):

    def get(self, podcast_id):

        try:
            listened = self.get_query_argument("listened", False)
            show_all = self.get_query_argument("all", False)
            episodes = self.db_query(PodcastSummaryView.get_episodes, podcast_id, listened, show_all)
            self.write(json.dumps(episodes, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = f"Could not get episodes for podcast {podcast_id}", exc_info = sys.exc_info())

    def post(self, podcast_id):

        try:
            podcast = self.db_action(PodcastSummaryView.update_episodes, podcast_id)
            self.write(json.dumps(podcast, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = f"Could not get episodes for {podcast_id}", exc_info = sys.exc_info())

class PodcastEpisodeHandler(BaseApiHandler):

    def get(self, podcast_id, episode_id):

        try:
            episode = self.db_action(PodcastEpisodeTable.get, episode_id)
            if episode is not None:
                self.write(json.dumps(episode, cls = self.JsonEncoder))
            else:
                self.write_error(404, messages = [ f"Episode not found: {episode_id}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get episode {episode_id}", exc_info = sys.exc_info())

