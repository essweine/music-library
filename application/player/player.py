from multiprocessing import Process, Pipe
import subprocess, signal, time, os
import logging
from datetime import datetime, timedelta

from ..library import Track
from .state import Task, State, ProcState
from .playlist import PlaylistEntry, StreamEntry
from .history import History

CMD = [ "ffmpeg", "-hide_banner" ]
OUTPUT_ARGS = [ "-f", "alsa", "hw:0" ]

class Player(object):

    def __init__(self, root):

        self.logger = logging.getLogger(__name__)
        self.root = root
        self.state = State(ProcState.Stopped, 0, [ ], [ ], None, False, False)
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
            try:
                initial_state = self.state.copy()

                while conn.poll():
                    task = conn.recv()
                    if task.name == "start":
                        self._start()
                    elif task.name == "pause":
                        self._pause()
                    elif task.name == "stop":
                        self._stop()
                    elif task.name == "skip":
                        self._handle_skip(task)
                    elif task.name == "move":
                        self._handle_move(task)
                    elif task.name == "add":
                        self._handle_add_to_playlist(task)
                    elif task.name == "remove":
                        self._handle_remove_from_playlist(task)
                    elif task.name == "clear":
                        self._handle_clear_playlist()
                    elif task.name == "stream":
                        self._handle_stream(task)
                    elif task.name == "repeat":
                        self._handle_repeat()
                    elif task.name == "shuffle":
                        self._handle_shuffle()

                if self._subprocess is not None:
                    self._check_subprocess()

                if self.state.proc_state == ProcState.Playing and self.state.stream is not None:
                    if self._subprocess is not None:
                        self._subprocess.stdin.write(self.state.stream.read())
                    else:
                        self._play(PlaylistEntry("-"))
                elif self.state.proc_state == ProcState.Playing and self._subprocess is None:
                    self._advance()

                if self.state != initial_state:
                    conn.send(self.state.copy())
                    # Only send history once to prevent duplicates
                    self.state.history.clear()

            except:
                self.logger.error("An unexpected error occurred", exc_info = True)

            time.sleep(0.05)

    def send_task(self, **kwargs):

        name = kwargs.pop("name")
        task = Task(name, **kwargs)
        self.conn.send(task)

    def update_history(self, cursor, state):

        for entry in state.history:
            if (entry.end_time - entry.start_time).seconds > 10:
                try:
                    History.create(cursor, entry)
                except Exception as exc:
                    self.logger.error("Could not create history entry for {entry.filename}", exc_info = True)
            if entry.error:
                self.logger.error(f"Error for {entry.filename}:\n{entry.error_output}")
        state.history.clear()
        self.state = state

    def _handle_stream(self, task):

        if self._subprocess_running():
            self._stop()
        self.state.stream = StreamEntry(task.url)
        self._start()

    def _handle_skip(self, task):

        playing = self.state.proc_state
        if self._subprocess_running():
            self._stop()
        self.state._playlist_state.skip(task.offset)
        self.state.current = self.state._playlist_state.current
        if playing == ProcState.Playing:
            self._start()

    def _handle_move(self, task):

        entry = self.state.playlist.pop(task.original)
        self.state.playlist.insert(task.destination, entry)
        if self.state.current == task.original:
            self.state._playlist_state.move(task.destination)
        if self.state.current == task.destination:
            self.state._playlist_state.move(task.original)
        self.state.current = self.state._playlist_state.current

    def _handle_add_to_playlist(self, task):

        entry = PlaylistEntry(task.filename)
        position = task.position if task.position is not None else len(self.state.playlist)
        self.state.playlist.insert(position, entry)
        self.state._playlist_state.add(position)
        self.state.current = self.state._playlist_state.current

    def _handle_remove_from_playlist(self, task):

        playing = self.state.proc_state
        if task.position == self.state.current and self._subprocess_running():
            self._stop()

        if task.position < len(self.state.playlist):
            self.state.playlist.pop(task.position)
            self.state._playlist_state.remove(task.position)
            self.state.current = self.state._playlist_state.current

        if playing == ProcState.Playing:
            self._start()

    def _handle_clear_playlist(self):

        if self._subprocess_running():
            self._stop()
        self.state.playlist.clear()
        self.state._playlist_state.clear()
        self.state.current = 0

    def _handle_repeat(self):

        self.state.repeat = not self.state.repeat
        self.state._playlist_state.repeat = self.state.repeat

    def _handle_shuffle(self):

        self.state.shuffle = not self.state.shuffle
        if self.state.shuffle:
            self.state._playlist_state.shuffle(self.state.current)
        else:
            self.state._playlist_state.unshuffle(self.state.current)

    def _start(self):

        try:
            if self.state.proc_state == ProcState.Paused and self._subprocess_running():
                self._subprocess.send_signal(signal.SIGCONT)
            if self.state.stream is not None:
                self.state.stream.connect()
            self.state.proc_state = ProcState.Playing
        except Exception as exc:
            self.logger.error("An exception occurred during start", exc_info = True)
            self.state.proc_state = ProcState.Paused

    def _advance(self):

        if not self.state._playlist_state.at_end:
            self.state.current = self.state._playlist_state.current
            entry = self.state.playlist[self.state.current]
            self._play(entry)
        else:
            self._stop()
            self.state._playlist_state.position = 0
            self.state.current = self.state._playlist_state.current

    def _pause(self):

        if self._subprocess_running():
            self._subprocess.send_signal(signal.SIGSTOP)
            self.state.proc_state = ProcState.Paused
            if self.state.stream is not None:
                self.state.stream.close()

    def _stop(self):

        try:
            if self._subprocess_running():
                if self.state.proc_state == ProcState.Paused:
                    self._subprocess.send_signal(signal.SIGCONT)
                self._subprocess.send_signal(signal.SIGTERM)
                self._reset_subprocess(False)
            if self.state.stream is not None:
                self.state.stream.close()
            self.state.stream = None
            self.state.proc_state = ProcState.Stopped
        except Exception as exc:
            self.logger.error("An exception occurred during stop", exc_info = True)

    def _play(self, entry):

        if self.state.stream is None:
            filename = self._append_to_root(entry.filename)
        else:
            filename = entry.filename

        try:
            self._subprocess = subprocess.Popen(
                CMD + [ "-i", filename ] + OUTPUT_ARGS,
                stderr = subprocess.PIPE,
                stdin = subprocess.PIPE,
            )
            stderr = self._subprocess.stderr.fileno()
            os.set_blocking(stderr, False)
            self.state.proc_state = ProcState.Playing
            entry.start_time = datetime.utcnow()
        except Exception as exc:
            self.logger.error("An exception occurred during play", exc_info = True)

    def _subprocess_running(self):

        return self._subprocess is not None and self._subprocess.poll() is None

    def _check_subprocess(self): 

        stderr = self._subprocess.stderr.read()
        retval = self._subprocess.poll()
        if retval is not None:
            if retval > 0:
                if self.state.stream is None:
                    entry = self.state.playlist[self.state.current]
                    entry.error = True
                    entry.error_output = stderr.decode("utf-8")
                else:
                    self.logger.error(stderr.decode("utf-8"))
            self._reset_subprocess(True)

    def _reset_subprocess(self, advance):

        self._subprocess.wait()
        stderr = self._subprocess.stderr.fileno()
        os.set_blocking(stderr, True)

        if self.state.stream is None:
            entry = self.state.playlist[self.state.current]
            entry.end_time = datetime.utcnow()
            self.state.history.append(entry)
            self.state.playlist[self.state.current] = PlaylistEntry(entry.filename)

        if advance:
            self.state._playlist_state.advance()

        self._subprocess = None

    def _append_to_root(self, filename):

        return os.path.join(self.root, filename)
