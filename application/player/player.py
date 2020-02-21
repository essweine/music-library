from multiprocessing import Process, Pipe
import subprocess, signal, time, os
import re
from datetime import datetime

from ..library import Track
from .state import State, HistoryEntry
from .history import History

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
        self.state = State(True, None, None, [ ])
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

            if self.state.stopped:
                pass
            elif self._subprocess is None:
                self._update_last_entry()
                self._handle_advance_playlist()
            else:
                self._check_subprocess()

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

    def update_state(self, state, cursor):

        if self.state.last_entry is not None:
            if (self.state.last_entry.end_time - self.state.last_entry.start_time).seconds > 10:
                entry = self.state.last_entry.log()
                History.create(cursor, entry)
        self.state = state

    def _handle_play_track(self, task):

        if self._subprocess_running():
            self._handle_stop()
        self._play(task.track)

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

    def _handle_stop(self):

        try:
            if self._subprocess is not None:
                self._subprocess.send_signal(signal.SIGTERM)
                self._reset_subprocess()
            self.state.stopped = True
        except:
            raise

    def _play(self, track):

        try:
            filename = self._append_to_root(track.filename)
            self._subprocess = subprocess.Popen(
                CMD + [ "-i", filename ] + OUTPUT_ARGS,
                stderr = subprocess.PIPE,
            )
            fd = self._subprocess.stderr.fileno()
            os.set_blocking(fd, False)
            self.state.current = HistoryEntry(track, datetime.utcnow())
            self.state.stopped = False
        except:
            raise

    def _subprocess_running(self):

        return self._subprocess is not None and self._subprocess.poll() is None

    def _check_subprocess(self): 

        data = self._subprocess.stderr.read()
        retval = self._subprocess.poll()
        if retval is not None:
            if retval > 0:
                self.state.current.error = True
                self.state.current.error_output = data.decode("utf-8")
            self._reset_subprocess()

    def _reset_subprocess(self):

        self._subprocess.wait()
        fd = self._subprocess.stderr.fileno()
        os.set_blocking(fd, True)
        self._update_last_entry()
        self._subprocess = None

    def _update_last_entry(self):

        if self.state.current is not None:
            self.state.current.end_time = datetime.utcnow()
            self.state.last_entry = self.state.current
            self.state.current = None

    def _append_to_root(self, filename):

        return os.path.join(self.root, filename)
