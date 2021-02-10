from multiprocessing import Process, Pipe
import subprocess, signal, time, os
import logging
import json
from datetime import datetime, timedelta

from ..library import StationTable, PodcastEpisodeTable, HistoryTable, PlaylistTrackView
from .state import Task, State, ProcState, ProcData
from .playlist import PlaylistEntry
from .stream import StationEntry, PodcastEntry

FFMPEG = [ "ffmpeg", "-hide_banner", "-f", "alsa", "hw:0" ]
FFPROBE = [
    "ffprobe", "-hide_banner",
    "-v", "quiet",
    "-show_entries", "format=duration,bit_rate:stream=sample_rate,sample_fmt,channels,channel_layout",
    "-of", "json",
]

class Player(object):

    def __init__(self, root):

        self.logger = logging.getLogger(__name__)
        self.root = root
        self.state = State()
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
                    task = Task(**conn.recv())
                    if task.name == "start":
                        self._start()
                    elif task.name == "pause":
                        self._pause()
                    elif task.name == "stop":
                        self._stop()
                    elif task.name == "seek":
                        self._handle_seek(task)
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
                    elif task.name == "podcast":
                        self._handle_podcast(task)
                    elif task.name == "repeat":
                        self._handle_repeat()
                    elif task.name == "shuffle":
                        self._handle_shuffle()
                    elif task.name == "preview":
                        self._handle_preview(task)

                if self._subprocess is not None:
                    self._check_subprocess()

                if self.state.proc_state == ProcState.Playing:
                    if self._subprocess is None:
                        self._continue()
                    elif self.state.stream is not None:
                        self._subprocess.stdin.write(self.state.stream.read())
                    if self.state.podcast is not None and not self.state.podcast._finished:
                        self.state.podcast.read()

                if self.state != initial_state:
                    conn.send(self.state.copy())
                    # Only send history once to prevent duplicates
                    self.state.previous = None

            except:
                self.logger.error("An unexpected error occurred", exc_info = True)

            time.sleep(0.05)

    def send_task(self, task):

        self.conn.send(task)

    def update_history(self, cursor):

        entry = self.state.previous
        if entry.error is not None:
            self.logger.error(f"An error occured during playback for {entry.entry_id}: {entry.error}")

        if entry.elapsed > 10000:
            try:
                if entry.entry_type == "track":
                    HistoryTable.update_history(cursor, entry)
                elif entry.entry_type == "station":
                    StationTable.update_history(cursor, entry)
                elif entry.entry_type == "podcast":
                    PodcastEpisodeTable.update_history(cursor, entry)
            except Exception as exc:
                self.logger.error("Could not create history entry for {entry.entry_id} of {entry.entry_type}", exc_info = True)

    def set_elapsed_time(self):

        if self.state.proc_state == ProcState.Playing:
            self.state.current.elapsed += int((datetime.utcnow() - self.state.current.last_updated).total_seconds() * 1000)
            self.state.current.last_updated = datetime.utcnow()

    def _handle_stream(self, task):

        if self._subprocess_running():
            self._stop()
        self.state.stream = StationEntry(task.url, info = task.info)
        self._start()

    def _handle_podcast(self, task):

        if self._subprocess_running():
            self._stop()
        meta = self._probe(task.url)
        duration = int(float(meta.get("format", { }).get("duration", 0)) * 1000)
        self.state.podcast = PodcastEntry(task.url, info = task.info, duration = duration)
        self.state.podcast.download()
        self.state.podcast.read()
        self._start()

    def _handle_skip(self, task):

        playing = self.state.proc_state
        if self._subprocess_running():
            self._stop()
        self.state.playlist.skip(task)
        self.state.playlist.set_position()
        if playing == ProcState.Playing:
            self._start()

    def _handle_move(self, task):

        self.state.playlist.move(task)
        self.state.playlist.set_position()

    def _handle_add_to_playlist(self, task):

        meta = self._probe(self._append_to_root(task.filename))
        duration = int(float(meta.get("format", { }).get("duration", 0)) * 1000)
        self.state.playlist.add(task, duration)
        self.state.playlist.set_position()

    def _handle_remove_from_playlist(self, task):

        playing = self.state.proc_state
        if task.position == self.state.playlist.position and self._subprocess_running():
            self._stop()
        self.state.playlist.remove(task)
        self.state.playlist.set_position()
        if playing == ProcState.Playing:
            self._start()

    def _handle_clear_playlist(self):

        if self._subprocess_running():
            self._stop()
        self.state.playlist.clear()

    def _handle_repeat(self):

        self.state.playlist.repeat = not self.state.playlist.repeat

    def _handle_shuffle(self):

        self.state.playlist.shuffle()

    def _handle_preview(self, task):

        self._handle_clear_playlist()
        for filename in task.filenames:
            info = PlaylistTrackView.create_item(filename = filename, title = filename).serialize()
            add_task = Task(name = "add", filename = filename, info = info, position = None)
            self._handle_add_to_playlist(add_task)
        self.state.playlist.preview = task.directory

    def _start(self):

        try:
            if self.state.proc_state == ProcState.Paused and self._subprocess_running():
                self._subprocess.send_signal(signal.SIGCONT)
                self.state.current.start_time = self.state.current.last_updated = datetime.utcnow()
            if self.state.stream is not None:
                self.state.stream.connect()
            self.state.proc_state = ProcState.Playing
        except Exception as exc:
            self.logger.error("An exception occurred during start", exc_info = True)
            self.state.proc_state = ProcState.Paused

    def _handle_seek(self, task):

        if self._subprocess_running():
            self._stop()
        self.state.current = self.state.previous
        self.state.current.elapsed = int(task.time) 
        self.state.previous = None
        if self.state.current.entry_type in [ "track", "preview" ]:
            filename = self._append_to_root(self.state.playlist.current_entry.filename)
        else:
            filename = self.state.podcast.filename
        self._play(filename, int(task.time / 1000))

    def _continue(self):

        if self.state.stream is not None:
            self.state.current = ProcData(
                entry_id = self.state.stream.url,
                entry_type = "station",
                title = self.state.stream.info["name"],
            )
            self._play("-")

        elif self.state.podcast is not None:
            self.state.current = ProcData(
                entry_id = self.state.podcast.url,
                entry_type = "podcast",
                title = self.state.podcast.info["podcast_name"],
                duration = self.state.podcast.duration,
            )
            self._play(self.state.podcast.filename)

        elif not self.state.playlist.at_end:
            self.state.playlist.set_position()
            entry = self.state.playlist.current_entry
            entry_type = "preview" if self.state.playlist.preview else "track"
            entry_id = entry.filename if entry_type == "track" else None
            self.state.current = ProcData(
                entry_id = entry_id,
                entry_type = entry_type,
                title = f"{entry.info['title']} ({' / '.join(entry.info['artist'])})",
                duration = entry.duration
            )
            filename = self._append_to_root(entry.filename)
            self._play(filename)

        else:
            self._stop()
            self.state.playlist._shuffle_position = 0
            self.state.playlist.set_position()

    def _pause(self):

        if self._subprocess_running():
            self._subprocess.send_signal(signal.SIGSTOP)
            self.set_elapsed_time()
            if self.state.stream is not None:
                self.state.stream.close()
                self.state.previous = self.state.current.copy()
                self.state.previous.end_time = datetime.utcnow()
            self.state.proc_state = ProcState.Paused

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

    def _play(self, filename, seek = None):

        if seek is None:
            args = [ "-i", filename ]
        else:
            args = [ "-ss", str(seek),  "-i", filename ]

        try:
            self._subprocess = subprocess.Popen(
                FFMPEG + args,
                stderr = subprocess.PIPE,
                stdin = subprocess.PIPE,
            )
            stderr = self._subprocess.stderr.fileno()
            os.set_blocking(stderr, False)
            self.state.current.start_time = self.state.current.last_updated = datetime.utcnow()
            self.state.proc_state = ProcState.Playing
        except Exception as exc:
            self.logger.error("An exception occurred during play", exc_info = True)

    def _probe(self, filename):

        try:
            probe = subprocess.Popen(
                FFPROBE + [ "-i", filename ],
                stdout = subprocess.PIPE,
                stderr = subprocess.PIPE,
            )
            probe.wait()
            return json.loads(probe.stdout.read())
        except Exception as exc:
            self.logger.error("An exception occurred during probe", exc_info = True)

    def _subprocess_running(self):

        return self._subprocess is not None and self._subprocess.poll() is None

    def _check_subprocess(self): 

        stderr = self._subprocess.stderr.read()
        retval = self._subprocess.poll()
        if retval is not None:
            if retval > 0:
                # TODO: figure out what different return values mean and handle accordingly
                self.state.current.error = stderr.decode("utf-8")
            self._reset_subprocess(True)

    def _reset_subprocess(self, advance):

        stderr = self._subprocess.stderr.fileno()
        os.set_blocking(stderr, True)
        self._subprocess.communicate()

        self.set_elapsed_time()
        self.state.current.end_time = datetime.utcnow()
        self.state.previous = self.state.current.copy()
        self.state.current = None

        if advance:
            self.state.playlist.advance()
            if self.state.podcast is not None:
                self.state.podcast.remove()
                self.state.podcast = None

        self._subprocess = None

    def _append_to_root(self, filename):

        return os.path.join(self.root, filename)
