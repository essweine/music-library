import sys
import json

from ..importer import DirectoryService
from ..util import BaseApiHandler, BaseSearchHandler
from .playlist import PlaylistTable, PlaylistEntryTable

class PlaylistRootHandler(BaseApiHandler):

    def get(self):

        try:
            playlists = self.db_query(PlaylistTable.get_all)
            self.write(json.dumps(playlists, cls = self.JsonEncoder))
        except Exception as exc:
            self.write_error(500, log_message = "Could not get playlists", exc_info = sys.exc_info())

    def post(self):

        try:
            playlist_id = self.db_action(PlaylistTable.create)
            self.write(json.dumps({ "id": playlist_id }))
        except Exception as exc:
            self.write_error(500, log_message = "Could not create playlist", exc_info = sys.exc_info())

class PlaylistSearchHandler(BaseSearchHandler):

    SearchType = "playlist"

    def get_configuration(self):
        return self.db_action(PlaylistTable.search_configuration)

    def search(self):
        return self.db_query(PlaylistTable.search, self.json_body)

class PlaylistHandler(BaseApiHandler):

    def get(self, playlist_id):

        try:
            playlist = self.db_action(PlaylistTable.get, playlist_id)
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
            self.db_action(PlaylistTable.update, self.json_body)
        except:
            self.write_error(500, log_message = f"Could not update playlist {playlist_id}", exc_info = sys.exc_info())

    def delete(self, playlist_id):

        try:
            self.db_action(PlaylistTable.delete, playlist_id)
        except:
            self.write_error(500, log_message = f"Could not update delete {playlist_id}", exc_info = sys.exc_info())

class PlaylistTrackHandler(BaseApiHandler):

    def get(self, playlist_id):

        try:
            tracks = self.db_action(PlaylistEntryTable.get_entries, playlist_id)
            self.write(json.dumps(tracks, cls = self.JsonEncoder))
        except:
            self.write_error(500, log_message = f"Could not retrieve tracks for {playlist_id}", exc_info = sys.exc_info())

