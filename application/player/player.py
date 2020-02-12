from multiprocessing import Process, Pipe
import subprocess, signal, time
import os, fcntl
import re

from ..library import Track
from .state import State

CMD = [ "ffmpeg", "-hide_banner" ]
OUTPUT_ARGS = [ "-f", "alsa", "hw:0" ]

class Task(object):

    def __init__(self, name, **kwargs):

        self.name = name
        self.track = kwargs.get("track", None)
        self.position = kwargs.get("position", None)

class Player(object):

    def __init__(self, root):

        self.root = root
        self.state = State(True, None, [ ], [ ], None, None)
        self._subprocess = None

        try:
            self.conn, child_conn = Pipe()
            self._process = Process(target = self.loop, args = (child_conn, ))
            self._process.start()
        except:
            raise

    def loop(self, conn):

        while True:

            initial_state = self.state.copy()

            while conn.poll():
                task = conn.recv()
                if task.name == "start":
                    self.state.stopped = False
                elif task.name == "play":
                    self._handle_play_track(task)
                elif task.name == "advance":
                    self._handle_advance_playlist()
                elif task.name == "add":
                    self._handle_add_to_playlist(task)
                elif task.name == "remove":
                    self._handle_remove_from_playlist(task)
                elif task.name == "stop":
                    self._handle_stop()

            if not self.state.stopped and not self._subprocess_running():
                self._update_recently_played()
                self._handle_advance_playlist()

            if self.state != initial_state:
                conn.send(self.state)

            time.sleep(1)

    def send_task(self, **kwargs):

        name = kwargs.pop("name")
        position = kwargs.pop("position", None)
        track = kwargs.pop("track", None)
        if track:
            track = Track(track)
        task = Task(name, track = track, position = position)
        self.conn.send(task)

    def update_state(self, state):

        self.state = state

    def _handle_stop(self):

        try:
            self._subprocess.send_signal(signal.SIGTERM)
            self._update_recently_played()
            self.state.stopped = True
        except:
            raise

    def _handle_play_track(self, task):

        if self._subprocess_running():
            self._handle_stop()
        self._play(task.track)

    def _play(self, track):

        try:
            filename = self._append_to_root(track.filename)
            self._subprocess = subprocess.Popen(
                CMD + [ "-i", filename ] + OUTPUT_ARGS,
                stdout = subprocess.DEVNULL,
                stderr = subprocess.PIPE,
            )
            fd = self._subprocess.stderr.fileno()
            fl = fcntl.fcntl(fd, fcntl.F_GETFL)
            fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
            self.state.current_track = track
            self.state.stopped = False
        except:
            raise

    def _handle_advance_playlist(self):

        if self._subprocess_running():
            self._handle_stop()

        if self.state.next_tracks:
            self._play(self.state.next_tracks.pop(0))

    def _handle_add_to_playlist(self, task):

        if task.position is not None:
            self.state.next_tracks.insert(task.position, task.track)
        else:
            self.state.next_tracks.append(task.track)

    def _handle_remove_from_playlist(self, task):

        if task.position is None:
            while self.state.next_tracks.count(task.track):
                self.state.next_tracks.remove(task.track)
        elif task.position < len(self.state.next_tracks):
            self.state.next_tracks.pop(task.position)

    def _subprocess_running(self): 

        if self._subprocess is not None:
            data = self._subprocess.stderr.read()
            retval = self._subprocess.poll()
            self._log_status(data, retval)
            return retval is None
        return False

    def _log_status(self, data, retval):

        if data:
            lines = [ line for line in re.split("[\n\r]+", data.decode("utf-8")) if line ]
            if lines:
                self.state.last_output = lines[0]
        if retval is not None and retval > 0:
            self.state.last_error = self.state.last_output

    def _update_recently_played(self):

        if self.state.current_track is not None:
            while self.state.recently_played.count(self.state.current_track):
                self.state.recently_played.remove(self.state.current_track)
            self.state.recently_played.append(self.state.current_track)
        self.state.current_track = None

    def _append_to_root(self, filename):

        return os.path.join(self.root, filename)
