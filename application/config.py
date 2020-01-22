AUDIO_FILETYPES = [ "flac" ]
TEXT_FILETYPES = [ "txt" ]
IMAGE_FILETYPES = [ "png", "jpeg", "jpg" ]

RECORDING_TABLE_DEFINITION = """
create table if not exists recording (
  id text,
  directory text,
  title text,
  artist text,
  composer text,
  genre text,
  notes text,
  artwork text,
  recording_date text,
  venue text,
  added_date text,
  rating number,
  sound_rating number
)
"""

TRACK_TABLE_DEFINITION = """
create table if not exists track (
  recording_id text,
  track_num number,
  title text,
  filename text,
  listen_count number default 0,
  rating number
)
"""


