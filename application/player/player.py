from multiprocessing import Process, Pipe
import subprocess, signal, time

CMD = "ffplay"
DEFAULT_ARGS = [ "-nodisp", "-hide_banner", "-autoexit" ]

class Task(object):

    def __init__(self, name, **kwargs):

        self.name = name
        self.track = kwargs.get("track", None)
        self.position = kwargs.get("position", None)

class Player(object):

    def __init__(self):

        self.stopped = True
        self.current_track = None
        self.recently_played = [ ]
        self.next_tracks = [ ]

        self._subprocess = None

        try:
            self.conn, child_conn = Pipe()
            self._process = Process(target = self.loop, args = (child_conn, ))
            self._process.start()
        except:
            raise

    def loop(self, conn):

        while True:

            state_changed = False

            while conn.poll():
                task = conn.recv()
                if task.name == "start":
                    self.stopped = False
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
                    self.stopped = True
                state_changed = True

            if not self.stopped and not self._subprocess_running():
                self._update_recently_played()
                self._handle_advance_playlist()
                state_changed = True

            if state_changed:
                conn.send((self.stopped, self.current_track, self.recently_played, self.next_tracks))

            time.sleep(1)

    def update_state(self, stopped, current_track, recently_played, next_tracks):

        self.stopped = stopped
        self.current_track = current_track
        self.recently_played = recently_played
        self.next_tracks = next_tracks

    def start(self):

        self.conn.send(Task("start"))

    def stop(self):

        self.conn.send(Task("stop"))

    def _handle_stop(self):

        try:
            self._subprocess.send_signal(signal.SIGTERM)
            self._update_recently_played()
        except:
            raise

    def play_track(self, track):

        task = Task("play", track = track)
        self.conn.send(task)

    def _handle_play_track(self, task):

        if self._subprocess_running():
            self._handle_stop()
        self._play(task.track)

    def _play(self, track):

        try:
            self._subprocess = subprocess.Popen(
                [ CMD, track.filename ] + DEFAULT_ARGS,
                stdout = subprocess.DEVNULL,
                stderr = subprocess.DEVNULL
            )
            self.current_track = track
        except:
            raise

    def advance_playlist(self):

        task = Task("advance")
        self.conn.send(task)

    def _handle_advance_playlist(self):

        if self._subprocess_running():
            self._handle_stop()

        if self.next_tracks:
            self._play(self.next_tracks.pop(0))

    def add_to_playlist(self, track, position = None):

        task = Task("add", track = track, position = position)
        self.conn.send(task)

    def _handle_add_to_playlist(self, task):

        if task.position is not None:
            self.next_tracks.insert(task.position, task.track)
        else:
            self.next_tracks.append(task.track)

    def remove_from_playlist(self, track, position = None):

        task = Task("remove", track = track, position = position)
        self.conn.send(task)

    def _handle_remove_from_playlist(self, task):

        if task.position is None:
            while self.next_tracks.count(task.track):
                self.next_tracks.remove(task.track)
        elif task.position < len(self.next_tracks):
            self.next_tracks.pop(task.position)

    def _subprocess_running(self): 

        return self._subprocess is not None and self._subprocess.poll() is None

    def _update_recently_played(self):

        if self.current_track is not None:
            while self.recently_played.count(self.current_track):
                self.recently_played.remove(self.current_track)
            self.recently_played.append(self.current_track)
        self.current_track = None


