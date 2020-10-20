import re
from dateutil.parser import parse as parsedate

from ..util import BaseObject

class ParsedText(BaseObject):

    def __init__(self, text):

        self.artist = [ ]
        self.composer = [ ]
        self.title = None
        self.recording_date = None
        self.venue = None
        self.track_titles = [ ]

        self._parse(text)

    def _parse(self, text):

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
                if self.artist is not None:
                    in_first_section = False
                in_setlist = False
                continue

            if re.match("\W*(Set|Encore|Disc)", line, flags = re.I):
                in_first_section = False
                in_setlist = True
                continue

            if in_first_section:

                if len(self.artist) == 0:
                    self.artist = [ name.strip() for name in line.split("/") ]
                    continue

                if self.recording_date is None:
                    self.recording_date = self._get_date_from_line(line)
                    if self.recording_date is not None:
                        continue

                composer = re.match("Composer:\s+(.*)", line, flags = re.I)
                if composer:
                    self.composer = [ name.strip() for name in composer.group(1).split("/") ]
                    continue

                if self.venue is None and not re.match("\w+,\s+\w+", line):
                    self.venue = line

                if not re.match("source|lineage|transfer", line, flags = re.I):
                    self.title = line if self.title is None else self.title + " " + line

            else:

                numbered_track = re.match("(D\d+)?(T\d+)?(\d+)(\W+?\s*|\s+)(.*)", line, flags = re.I)
                timed_track = re.search("(.*)\(?\d+:\d{2}\)?", line)
                if numbered_track:
                    self.track_titles.append(numbered_track.group(5))
                elif timed_track:
                    self.track_titles.append(timed_track.group(1))
                elif in_setlist:
                    self.track_titles.append(line)

    @staticmethod
    def _get_date_from_line(line):

        try:
            return parsedate(line).strftime("%Y-%m-%d")
        except:
            pass

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
