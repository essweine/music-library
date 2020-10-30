import sys
import json

from . import Playlist, Search
from ..importer import DirectoryService
from ..util import BaseApiHandler

class PlaylistRootHandler(BaseApiHandler):

    def get(self):

        try:
            playlists = self.db_query(Playlist.get_all)
            self.write(json.dumps(playlists, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not get playlists", exc_info = sys.exc_info())

    def post(self):

        if self.json_body:
            results = self.db_query(Search.playlist, self.json_body)
            self.write(json.dumps(results, cls = self.JsonEncoder))
        else:
            self.write_error(400, messsages = [ "Expected json" ])

class PlaylistHandler(BaseApiHandler):

    def get(self, playlist_id):

        try:
            playlist = self.db_action(Playlist.get, playlist_id)
            if playlist is not None:
                self.write(json.dumps(playlist, cls = self.JsonEncoder))
            else:
                self.write_error(404, messages = [ f"Playlist not found: {playlist_id}" ])
        except Exception as exc:
            self.write_error(500, log_message = f"Could not get playlist {playlist_id}", exc_info = sys.exc_info())

    def put(self, playlist_id):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            self.db_action(Playlist.update, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not update playlist {playlist_id}", exc_info = sys.exc_info())

    def post(self, playlist_id):

        if self.json_body is None:
            self.write_error(400, messsages = [ "Expected json" ])

        try:
            self.db_action(Playlist.create, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not create playlist {playlist_id}", exc_info = sys.exc_info())
