from multiprocessing import Process, Pipe
import subprocess, signal, time, os
import re
import logging
from datetime import datetime, timedelta

from ..library import Track
from .state import State, Task, PlaylistEntry, ProcState
from .history import History

CMD = [ "ffmpeg", "-hide_banner" ]
OUTPUT_ARGS = [ "-f", "alsa", "hw:0" ]

class Player(object):

    def __init__(self, root):

        self.logger = logging.getLogger(__name__)
        self.root = root
        self.state = State(ProcState.Stopped, None, None, [ ], [ ])
        self._subprocess = None
        self.logger = logging.getLogger('tornado.application')
        self.websockets = set()

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
                    self._handle_start()
                elif task.name == "play":
                    self._handle_play_entry(task)
                elif task.name == "pause":
                    self._handle_pause()
                elif task.name == "add":
                    self._handle_add_to_playlist(task)
                elif task.name == "remove":
                    self._handle_remove_from_playlist(task)
                elif task.name == "stop":
                    self._handle_stop()

            if self._subprocess is not None:
                self._check_subprocess()

            if self.state.proc_state == ProcState.Playing and self._subprocess is None:
                self._handle_advance_playlist()

            if self.state != initial_state:
                conn.send(self.state)
                # Never send the last entry more than once to prevent duplicate history items
                self.state.last_entry = None

            time.sleep(0.20)

    def send_task(self, **kwargs):

        name = kwargs.pop("name")
        position = kwargs.pop("position", None)
        filename = kwargs.pop("filename", None)
        task = Task(name, filename, position)
        self.conn.send(task)

    def update_state(self, cursor, state):

        # Maintain recently played only in parent (the forked process doesn't need it)
        period_start = datetime.utcnow() - timedelta(minutes = 30)
        state.recently_played = [ track for track in self.state.recently_played if track.end_time > period_start ]
        if state.last_entry is not None:
            if (state.last_entry.end_time - state.last_entry.start_time).seconds > 10:
                try:
                    History.create(cursor, state.last_entry)
                except Exception as exc:
                    self.logger.error("Could not create history entry for {state.last_entry.filename}", exc_info = True)
                state.recently_played.insert(0, state.last_entry)
            if state.last_entry.error:
                self.logger.error(f"Error for {state.last_entry.filename}:\n{state.last_entry.error_output}")
            state.last_entry = None
        self.state = state

    def _handle_play_entry(self, task):

        entry = PlaylistEntry(task.filename, None)
        if self._subprocess_running():
            self._handle_stop()
        self._play(entry)

    def _handle_advance_playlist(self):

        if self._subprocess_running():
            self._handle_stop()

        if self.state.next_entries:
            self._play(self.state.next_entries.pop(0))

    def _handle_add_to_playlist(self, task):

        entry = PlaylistEntry(task.filename, None)
        if task.position is not None:
            self.state.next_entries.insert(task.position, entry)
        else:
            self.state.next_entries.append(entry)

    def _handle_remove_from_playlist(self, task):

        if task.position is None:
            for entry in [ entry for entry in self.state.next_entries if entry.filename == task.filename ]:
                self.state.next_entries.remove(entry)
        elif task.position < len(self.state.next_entries):
            self.state.next_entries.pop(task.position)

    def _handle_pause(self):

        if self._subprocess_running():
            self._subprocess.send_signal(signal.SIGSTOP)
            self.state.proc_state = ProcState.Paused

    def _handle_start(self):

        try:
            if self.state.proc_state == ProcState.Paused and self._subprocess_running():
                self._subprocess.send_signal(signal.SIGCONT)
            self.state.proc_state = ProcState.Playing
        except Exception as exc:
            self.logger.error("An exception occurred during start", exc_info = True)

    def _handle_stop(self):

        try:
            if self._subprocess_running():
                if self.state.proc_state == ProcState.Paused:
                    self._subprocess.send_signal(signal.SIGCONT)
                self._subprocess.send_signal(signal.SIGTERM)
                self._reset_subprocess()
            self.state.proc_state = ProcState.Stopped
        except Exception as exc:
            self.logger.error("An exception occurred during stop", exc_info = True)

    def _play(self, entry):

        try:
            filename = self._append_to_root(entry.filename)
            self._subprocess = subprocess.Popen(
                CMD + [ "-i", filename ] + OUTPUT_ARGS,
                stderr = subprocess.PIPE,
            )
            stderr = self._subprocess.stderr.fileno()
            os.set_blocking(stderr, False)
            entry.start_time = datetime.utcnow()
            self.state.current = entry
            self.state.proc_state = ProcState.Playing
        except Exception as exc:
            self.logger.error("An exception occurred during play", exc_info = True)

    def _subprocess_running(self):

        return self._subprocess is not None and self._subprocess.poll() is None

    def _check_subprocess(self): 

        stderr = self._subprocess.stderr.read()
        retval = self._subprocess.poll()
        if retval is not None:
            if retval > 0:
                self.state.current.error = True
                self.state.current.error_output = stderr.decode("utf-8")
            self._reset_subprocess()
        elif stderr is not None:
            for line in stderr.decode("utf-8").split():
                elapsed = re.match("time=(.*?)\.", line)
                if elapsed:
                    hours, minutes, seconds = elapsed.group(1).split(":")
                    self.state.elapsed = { "hours": int(hours), "minutes": int(minutes), "seconds": int(seconds) }

    def _reset_subprocess(self):

        self._subprocess.wait()
        stderr = self._subprocess.stderr.fileno()
        os.set_blocking(stderr, True)
        self._update_last_entry()
        self._subprocess = None

    def _update_last_entry(self):

        if self.state.current is not None:
            self.state.current.end_time = datetime.utcnow()
            self.state.last_entry = self.state.current
            self.state.current = None

    def _append_to_root(self, filename):

        return os.path.join(self.root, filename)
