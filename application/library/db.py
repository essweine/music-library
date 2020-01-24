from datetime import datetime
from .recording import RECORDING_COLUMNS, TRACK_COLUMNS

def table_definition(name, COLUMNS):

    col_def = lambda col_type, default: col_type if default is None else "{0} default {1}".format(col_type, default)
    columns, col_defs = zip(*[ (col, col_def(col_type, default)) for col, col_type, default in COLUMNS ])
    return "create table if not exists {name} ({table_def})".format(
        name = name,
        table_def = ", ".join([ "{0} {1}".format(col, col_def) for col, col_def in zip(columns, col_defs) ]),
    )

def insert_statement(name, COLUMNS):

    columns, placeholders = zip(*[ (col, "?") for col, col_type, default in COLUMNS ])
    return "insert into {name} ({columns}) values ({placeholders})".format(
        name = name,
        columns = ", ".join(columns),
        placeholders = ", ".join(placeholders),
    )

def create_recording(cursor, **recording):

    insert_recording = insert_statement("recording", RECORDING_COLUMNS)
    insert_track = insert_statement("track", TRACK_COLUMNS)

    recording["added_date"] = datetime.utcnow().strftime("%Y-%m-%d")
    recording_values = [ recording.get(col, default) for col, col_type, default in RECORDING_COLUMNS ]
    get_track = lambda track: [ track.get(col, default) for col, col_type, default in TRACK_COLUMNS ]
    for track in recording.get("tracks", [ ]):
        track["recording_id"] = recording["id"]
    tracks_values = [ get_track(track) for track in recording.get("tracks", [ ]) ]

    try:
        cursor.execute(insert_recording, recording_values)
        cursor.executemany(insert_track, tracks_values)
    except Exception as exc:
        raise
