import subprocess, signal, os
import logging
import json
from datetime import datetime, timedelta

from ..library import PlaylistTrackView
from .state import State, ProcState, PlayerMode
from .proc_input import FileInput, DownloadInput, StreamInput
from .playlist import PlaylistEntry

logger = logging.getLogger('tornado.application')

FFMPEG = [ "ffmpeg", "-hide_banner", "-f", "alsa", "hw:0" ]
FFPROBE = [
    "ffprobe", "-hide_banner",
    "-v", "quiet",
    "-show_entries", "format=duration,bit_rate:stream=sample_rate,sample_fmt,channels,channel_layout",
    "-of", "json",
]

class Player(object):

    def __init__(self, root):

        self.root = root
        self.state = State()
        self.websockets = set()
        self._subprocess = None

    def notify(self):

        for ws in self.websockets:
            ws.write_message("state changed")

    def get_state(self, cursor):

        state = self.state.copy()
        if state.current is not None:
            state.current.set_info(cursor)

        if state.playlist.preview is None:
            playlist_info = PlaylistTrackView.from_filenames(cursor, [ entry.filename for entry in state.playlist.entries ])
        else:
            create_item = lambda filename: PlaylistTrackView.create_item(filename = filename, title = filename)
            playlist_info = [ create_item(entry.filename) for entry in state.playlist.entries ]

        for entry, info in zip(state.playlist.entries, playlist_info):
            entry.info = info

        return state

    def execute(self, task):

        try:
            if task.name == "start":
                self._start()
            elif task.name == "pause":
                self._pause()
            elif task.name == "stop":
                self._stop()
            elif task.name == "seek":
                self._handle_seek(task)
            elif task.name == "stream":
                self._set_stream(task)
            elif task.name == "podcast":
                self._set_download(task)
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
            elif task.name == "repeat":
                self._handle_repeat()
            elif task.name == "shuffle":
                self._handle_shuffle()
            elif task.name == "preview":
                self._handle_preview(task)

        except Exception as exc:
            self.state.proc_state = ProcState.Error
            logger.error(str(exc), exc_info = True)

        self.notify()

    def check_state(self, cursor):

        if self.state.proc_state is ProcState.Playing:
            self._set_elapsed_time()

        initial_state = self.state.copy()
        try:
            if self._subprocess is not None:
                self._check_subprocess()

            if self.state.proc_state is ProcState.Playing:
                if self._subprocess is None:
                    if self.state.mode is PlayerMode.Playlist:
                        self._set_file_input()
                    if self.state.mode is PlayerMode.Download:
                        self._stop()
                if self.state.mode is PlayerMode.Stream:
                    self._subprocess.stdin.write(self.state.current.read())

        except Exception as exc:
            self.state.proc_state = ProcState.Error
            logger.error(str(exc), exc_info = True)

        if self.state._previous is not None:
            if self.state.playlist.preview is None and self.state._previous.elapsed > 10000:
                try:
                    self.state._previous.update_history(cursor)
                except Exception as exc:
                    logger.error(f"Could not create history entry for {previous.title}", exc_info = True)
            if self.state.mode is PlayerMode.Download:
                self.state._previous.remove()
                self.state.mode = PlayerMode.Playlist
            self.state._previous = None

        try:
            if self.state.mode is PlayerMode.Download and not self.state.current.download_finished:
                self.state.current.read()
        except Exception as exc:
            self.state.proc_state = ProcState.Error
            logger.error(ste(exc), exc_info = True)

        if self.state != initial_state:
            self.notify()

    def _set_elapsed_time(self):

        self.state.current.elapsed += int((datetime.utcnow() - self.state.current.last_updated).total_seconds() * 1000)
        self.state.current.last_updated = datetime.utcnow()

    def _set_file_input(self):

        if not self.state.playlist.at_end:
            entry = self.state.playlist.current_entry
            self.state.current = FileInput(
                filename = self._get_path(entry.filename),
                track_id = entry.filename if self.state.playlist.preview is None else None,
                duration = entry.duration,
            )
            self._play()
        else:
            self._stop()
            self.state.playlist.reset()

    def _set_stream(self, task):

        if self._subprocess_running():
            self._stop()
        self.state.mode = PlayerMode.Stream
        self.state.current = StreamInput(
            url = task.url, 
            filename = "-"
        )
        self._start()

    def _set_download(self, task):

        if self._subprocess_running():
            self._stop()
        meta = self._probe(task.url)
        duration = int(float(meta.get("format", { }).get("duration", 0)) * 1000)
        self.state.mode = PlayerMode.Download
        self.state.current = DownloadInput(
            url = task.url,
            filename = None,
            duration = duration
        )
        self.state.current.download()
        self.state.current.read()
        self._start()

    def _handle_skip(self, task):

        playing = self.state.proc_state
        if self._subprocess_running():
            self._stop()
        self.state.playlist.skip(task.offset)
        if playing is ProcState.Playing:
            self._start()

    def _handle_move(self, task):

        self.state.playlist.move(task.original, task.destination)

    def _handle_add_to_playlist(self, task):

        if self.state.playlist.preview is None:
            for filename in task.filenames:
                meta = self._probe(self._get_path(filename))
                duration = int(float(meta.get("format", { }).get("duration", 0)) * 1000)
                self.state.playlist.add(PlaylistEntry(filename, duration), task.position)

    def _handle_remove_from_playlist(self, task):

        playing = self.state.proc_state
        if task.position == self.state.playlist.position and self._subprocess_running():
            self._stop()
        self.state.playlist.remove(task.position)
        if playing is ProcState.Playing:
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
            meta = self._probe(self._get_path(filename))
            duration = int(float(meta.get("format", { }).get("duration", 0)) * 1000)
            self.state.playlist.add(PlaylistEntry(filename, duration))
        self.state.playlist.preview = task.directory

    def _start(self):

        if self.state.mode is PlayerMode.Stream:
            self.state.current.connect()

        if self.state.proc_state is ProcState.Paused and self._subprocess_running():
            self._subprocess.send_signal(signal.SIGCONT)
            self.state.current.start_time = self.state.current.last_updated = datetime.utcnow()
            self.state.proc_state = ProcState.Playing
        elif self._subprocess_running():
            pass
        elif self.state.mode is PlayerMode.Playlist and self.state.current is None:
            self._set_file_input()
        else:
            self._play()

    def _handle_seek(self, task):

        if self._subprocess_running():
            self._stop()
        self.state.current = self.state._previous
        self.state.current.elapsed = int(task.time) 
        self.state._previous = None
        self._play(int(task.time / 1000))

    def _pause(self):

        if self._subprocess_running():
            self._subprocess.send_signal(signal.SIGSTOP)
            self._set_elapsed_time()
            if self.state.mode is PlayerMode.Stream:
                self.state.current.close()
                self.state._previous = self.state.current
                self.state._previous.end_time = datetime.utcnow()

        self.state.proc_state = ProcState.Paused

    def _stop(self):

        if self.state.mode is PlayerMode.Stream:
            self.state.current.close()
            self.state.mode = PlayerMode.Playlist

        if self._subprocess_running():
            if self.state.proc_state is ProcState.Paused:
                self._subprocess.send_signal(signal.SIGCONT)
            self._subprocess.send_signal(signal.SIGTERM)
            self._reset_subprocess(False)

        self.state.proc_state = ProcState.Stopped

    def _play(self, seek = None):

        if seek is None:
            args = [ "-i", self.state.current.filename ]
        else:
            args = [ "-ss", str(seek),  "-i", self.state.current.filename ]

        self._subprocess = subprocess.Popen(
            FFMPEG + args,
            stderr = subprocess.PIPE,
            stdin = subprocess.PIPE,
        )
        stderr = self._subprocess.stderr.fileno()
        os.set_blocking(stderr, False)
        self.state.current.start_time = self.state.current.last_updated = datetime.utcnow()
        self.state.proc_state = ProcState.Playing

    def _subprocess_running(self):

        return self._subprocess is not None and self._subprocess.poll() is None

    def _check_subprocess(self): 

        stderr = self._subprocess.stderr.read()
        retval = self._subprocess.poll()
        if retval is not None:
            if retval > 0:
                # TODO: figure out what different return values mean and handle accordingly
                self.state.current.error = stderr.decode("utf-8")
                self._reset_subprocess(False)
            else:
                self._reset_subprocess(True)

    def _reset_subprocess(self, advance):

        stderr = self._subprocess.stderr.fileno()
        os.set_blocking(stderr, True)
        self._subprocess.communicate()
        self._subprocess = None

        self._set_elapsed_time()
        self.state.current.end_time = datetime.utcnow()
        if self.state.current.error is not None:
            raise Exception(f"FFMPEG error: {self.state.current.error}")

        self.state._previous = self.state.current
        self.state.current = None
        if advance:
            self.state.playlist.advance()

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
            logger.error("An exception occurred during probe", exc_info = True)

    def _get_path(self, filename):

        return os.path.join(self.root, filename)
