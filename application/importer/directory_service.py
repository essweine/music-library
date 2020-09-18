import os
import re, json
from uuid import uuid4

from ..config import AUDIO_FILETYPES, IMAGE_FILETYPES, TEXT_FILETYPES
from ..util import JsonSerializable
from ..library import Recording, Track
from .parsed_text import ParsedText

class DirectoryListing(JsonSerializable):

    def __init__(self, relative_path, children, audio, images, text):

        self.relative_path = relative_path
        self.children = sorted(children, key = lambda c: c.relative_path)
        self.audio = sorted(audio)
        self.images = sorted(images)
        self.text = sorted(text)

class DirectoryService(object):

    def __init__(self, root_path, indexed_directories):

        self.indexed_directories = set(indexed_directories)
        self.root_path = root_path
        self.root = self.index()

    def index(self):

        return self.get_directory_info(self.root_path)

    def get_directory(self, directory):

        return self.get_directory_info(os.path.join(self.root_path, directory))

    def list_all(self, acc = None, parent = None):

        if acc is None:
            acc = [ ]
        if parent is None:
            parent = self.root
        for child in parent.children:
            if any(map(len, [ child.children, child.audio, child.images, child.text ])):
                acc.append(child)
                self.list_all(acc, child)
        return acc

    def aggregate(self, directory):

        for child in directory.children:
            self.aggregate(child)
            child.children = [ ]
            directory.audio.extend(child.audio)
            directory.images.extend(child.images)
            directory.text.extend(child.text)
        directory.children = [ ]

    def remove(self, directory, parent = None):

        if parent is None:
            parent = self.root

        for idx, child in enumerate(parent.children):
            if child.relative_path == directory:
                parent.children.pop(idx)
                return True
            if self.remove(directory, child):
                return True

    def get_directory_info(self, directory):

        relative_path = re.sub("^{0}/?".format(self.root_path), "", directory)
        audio, images, text, children = [ ], [ ], [ ], [ ]
        for filename in os.listdir(directory):
            path = os.path.join(directory, filename)
            index_path = os.path.join(relative_path, filename)
            if os.path.isdir(path) and index_path not in self.indexed_directories:
                child = self.get_directory_info(path)
                children.append(child)
            elif self.is_audio(index_path):
                audio.append(index_path)
            elif self.is_image(filename):
                images.append(index_path)
            elif self.is_text(filename):
                text.append(index_path)

        return DirectoryListing(relative_path, children, audio, images, text)

    def add_directory_to_index(self, directory):

        self.indexed_directories.add(directory)
        self.remove(directory)

    def create_recording(self, directory, textfile = None):

        recording = Recording()
        recording.id, recording.directory = str(uuid4()), directory.relative_path

        for idx, filename in enumerate(directory.audio):
            track = Track()
            track.filename     = filename
            track.track_num    = idx + 1
            track.recording_id = recording.id
            recording.tracks.append(track)

        if textfile is not None:
            parsed_text              = self.parse_text(textfile)
            recording.title          = parsed_text.title
            recording.artist         = parsed_text.artist
            recording.recording_date = parsed_text.recording_date
            recording.venue          = parsed_text.venue
            recording.notes          = textfile
            for idx, title in enumerate(parsed_text.track_titles):
                if idx < len(recording.tracks):
                    recording.tracks[idx].title = title
                    recording.tracks[idx].composer = parsed_text.composer

        return recording

    def parse_text(self, filename):

        with open(os.path.join(self.root_path, filename), 'rb') as text:
            return ParsedText(text)

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

    def __repr__(self):
        return f"Directory Service for {self.root_path}"
