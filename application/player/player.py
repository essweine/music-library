from multiprocessing import Process, Pipe
import subprocess, signal, time, os
import re
from datetime import datetime, timedelta

from ..library import Track
from .state import State, Task, PlaylistTrackData, PlaylistEntry
from .history import History

CMD = [ "ffmpeg", "-hide_banner" ]
OUTPUT_ARGS = [ "-f", "alsa", "hw:0" ]

class Player(object):

    def __init__(self, root):

        self.root = root
        self.state = State(True, None, None, [ ], [ ])
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
                    self._handle_play_entry(task)
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
        track_data = kwargs.pop("track_data", None)
        if track_data:
            track_data = PlaylistTrackData(**track_data)
        task = Task(name, track_data = track_data, position = position)
        self.conn.send(task)

    def update_state(self, state, cursor):

        if self.state.last_entry is not None:
            if (self.state.last_entry.end_time - self.state.last_entry.start_time).seconds > 10:
                History.create(cursor, self.state.last_entry)
            state.last_entry = None
        self.state = state
        self.state.recently_played = History.get_playlist_entries(
            cursor, 
            datetime.utcnow() - timedelta(minutes = 30), 
            datetime.utcnow()
        )

    def _handle_play_entry(self, task):

        if self._subprocess_running():
            self._handle_stop()
        self._play(task.track_data)

    def _handle_advance_playlist(self):

        if self._subprocess_running():
            self._handle_stop()

        if self.state.next_entries:
            self._play(self.state.next_entries.pop(0))

    def _handle_add_to_playlist(self, task):

        if task.position is not None:
            self.state.next_entries.insert(task.position, task.track_data)
        else:
            self.state.next_entries.append(task.track_data)

    def _handle_remove_from_playlist(self, task):

        if task.position is None:
            while self.state.next_entries.count(task.track_data):
                self.state.next_entries.remove(task.track_data)
        elif task.position < len(self.state.next_entries):
            self.state.next_entries.pop(task.position)

    def _handle_stop(self):

        try:
            if self._subprocess is not None:
                self._subprocess.send_signal(signal.SIGTERM)
                self._reset_subprocess()
            self.state.stopped = True
        except:
            raise

    def _play(self, track_data):

        try:
            filename = self._append_to_root(track_data.filename)
            self._subprocess = subprocess.Popen(
                CMD + [ "-i", filename ] + OUTPUT_ARGS,
                stderr = subprocess.PIPE,
            )
            fd = self._subprocess.stderr.fileno()
            os.set_blocking(fd, False)
            self.state.current = PlaylistEntry(track_data, datetime.utcnow())
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
