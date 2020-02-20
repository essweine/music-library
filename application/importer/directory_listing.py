import os
import re, json
import sqlite3
from uuid import uuid4
from dateutil.parser import parse as parsedate

from ..config import AUDIO_FILETYPES, IMAGE_FILETYPES, TEXT_FILETYPES
from ..library import Recording, Track
from ..util import JsonEncoder

class DirectoryListing(object):

    @staticmethod
    def is_audio(filename):
        return filename.split(".")[-1].lower() in AUDIO_FILETYPES

    @staticmethod
    def is_image(filename):
        return filename.split(".")[-1].lower() in IMAGE_FILETYPES

    @staticmethod
    def is_text(filename):
        return filename.split(".")[-1].lower() in TEXT_FILETYPES and not re.search("\.ffp\.?", filename, flags = re.I)

    @classmethod
    def contains_audio(cls, filenames):
        return any([ cls.is_audio(filename) for filename in filenames ])

    def __init__(self, name, root):

        self.id = str(uuid4())
        self.name = name
        self.root = root
        self.parent = os.path.dirname(name)
        self.audio, self.images, self.text, self.children = [ ], [ ], [ ], [ ]

        try:
            for dirpath, dirs, files in os.walk(os.path.join(root, name)):
                relative_path = re.sub("^{0}/?".format(root), "", dirpath)
                self.children.extend([ os.path.join(relative_path, d) for d in dirs ])
                self.audio.extend([ os.path.join(relative_path, f) for f in files if self.is_audio(f) ])
                self.text.extend([ os.path.join(relative_path, f) for f in files if self.is_text(f) ])
                self.images.extend([ os.path.join(relative_path, f) for f in files if self.is_image(f) ])
        except:
            raise

        self.audio = sorted(self.audio)
        self.images = sorted(self.images)
        self.text = sorted(self.text)

    def as_dict(self):

        return {
            "id": self.id,
            "name": self.name,
            "audio": self.audio,
            "images": self.images,
            "text": self.text,
        }

    def as_recording(self, textfile = None):

        if textfile:
            recording = self._parse(textfile)
            recording.notes = textfile
        else:
            data = Recording()
            data.tracks = [ ]

        recording.id, recording.directory = self.id, self.name
        for idx, filename in enumerate(self.audio):
            if idx < len(recording.tracks):
                track = recording.tracks[idx]
            else:
                track = Track()
                recording.tracks.append(track)
            track.filename     = filename
            track.track_num    = idx + 1
            track.recording_id = self.id

        return recording

    def _parse(self, filename):

        try:
            text = open(os.path.join(self.root, filename), 'rb')
        except:
            raise

        recording = Recording()

        in_first_section, in_setlist = True, False

        for line in text:

            try:
                line = line.decode("utf-8")
            except UnicodeDecodeError:
                line = line.decode("latin-1")
            except:
                raise

            line = line.strip()

            if not re.search("\w+", line):
                if recording.artist is not None:
                    in_first_section = False
                in_setlist = False
                continue

            if re.match("\W*(Set|Encore|Disc)", line, flags = re.I):
                in_first_section = False
                in_setlist = True
                continue

            if in_first_section:

                if recording.artist is None:
                    recording.artist = line
                    continue

                if recording.recording_date is None:
                    try:
                        recording.recording_date = parsedate(line).strftime("%Y-%m-%d")
                        continue
                    except:
                        recording.recording_date = self._get_date_from_line(line)

                if recording.venue is None and not re.match("\w+,\s+\w+", line):
                    recording.venue = line

                if not re.match("source|lineage|transfer", line, flags = re.I):
                    recording.title = line if recording.title is None else recording.title + " " + line

            else:

                numbered_track = re.match("(D\d+)?(T\d+)?(\d+)(\W+?\s*|\s+)(.*)", line, flags = re.I)
                timed_track = re.search("(.*)\(?\d+:\d{2}\)?", line)
                track = Track()
                if numbered_track:
                    track.title = numbered_track.group(5)
                elif timed_track:
                    track.title = timed_track.group(1)
                elif in_setlist:
                    track.title = line

                if track.title:
                    recording.tracks.append(track)

        return recording

    def _get_date_from_line(self, line):

        dt = None
        items = line.split()
        for position in range(len(items) - 1):
            try:
                return parsedate(items[position:]).strftime("%Y-%m-%d")
            except:
                pass
            try:
                return parsedate(items[:position]).strftime("%Y-%m-%d")
            except:
                pass

        for item in items:
            try:
                return parsedate(items[position:]).strftime("%Y-%m-%d")
            except:
                pass

    def __repr__(self):

        return json.dumps(self, cls = JsonEncoder, indent = 2, separators = [ ", ", ": " ])

