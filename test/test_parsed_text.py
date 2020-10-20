import unittest

from application.importer.parsed_text import ParsedText

class TestParsedText(unittest.TestCase):

    def test_parse_recording_data(self):

        with open("test/data/root/Keep It Like A Secret/info.txt", "rb") as text:
            parsed = ParsedText(text)

        self.assertEqual(parsed.artist[0], "Built to Spill")
        self.assertEqual(parsed.title, "Keep It Like a Secret")
        self.assertEqual(parsed.recording_date, "1999-02-02")
        self.assertEqual(len(parsed.track_titles), 10)

    def test_parse_timed_tracks(self):

        with open("test/data/text/timed_tracks.txt", "rb") as text:
            parsed = ParsedText(text)
        self.assertEqual(len(parsed.track_titles), 10)

    def test_parse_tracks_heading(self):

        with open("test/data/text/tracks_with_heading.txt", "rb") as text:
            parsed = ParsedText(text)
        self.assertEqual(len(parsed.track_titles), 18)
