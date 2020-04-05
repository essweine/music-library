import json

from tornado.web import RequestHandler
from tornado.websocket import WebSocketHandler
from tornado import log as logger

from ..util import BaseRequestHandler, BaseApiHandler
from ..library import PlaylistTrack

class PlayerDisplayHandler(BaseRequestHandler):

    def get(self):

        self.render("player.html")

class PlayerHandler(BaseApiHandler):

    def get(self):

        self.write(json.dumps(self._get_state(), cls = self.JsonEncoder))

    def post(self):

        if self.json_body:
            for task in self.json_body["tasks"]:
                self.application.player.send_task(**task)
        else:
            self.logger.error(f"POST request {request.url}: expected json")

    def _get_state(self):

        # I don't think I like this.  Maybe I need to rethink how db access works.
        state = { "current": None, "next_entries": [ ], "recently_played": [ ] }
        state["proc_state"] = self.application.player.state.proc_state.value
        state["elapsed"] = self.application.player.state.elapsed
        try:
            if self.application.player.state.current is not None:
                state["current"] = self.db_query(PlaylistTrack.from_filename, self.application.player.state.current.filename)[0]
            # And sadly I can't use a batch query since I need to preserve the order of the tracks.
            for filename in [ entry.filename for entry in self.application.player.state.next_entries ]:
                state["next_entries"].append(self.db_query(PlaylistTrack.from_filename, filename)[0])
            for filename in [ entry.filename for entry in self.application.player.state.recently_played ]:
                state["recently_played"].append(self.db_query(PlaylistTrack.from_filename, filename)[0])
        except Exception as exc:
            self.logger.error("Could not get track info", exc_info = True)
        return state

class PlayerNotificationHandler(WebSocketHandler):

    def open(self):
        self.application.player.websockets.add(self)
        self.write_message("open");

    def on_close(self):
        self.application.player.websockets.remove(self)

    def on_message(self, message):
        pass

