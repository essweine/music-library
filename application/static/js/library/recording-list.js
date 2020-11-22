import { Container, ContainerDefinition } from "../application.js";
import { ListRoot, SearchBar } from "../shared/list.js";
import { Rating } from "../api.js";

function RecordingList() { 

    let columns = [
        { display: "Artist", className: "recording-list-artist", type: "text" },
        { display: "Title", className: "recording-list-title", type: "text" },
        { display: "Date", className: "recording-list-date", type: "text" },
        { display: "Rating", className: "recording-list-rating", type: "rating" },
        { display: "Sound Rating", className: "recording-list-sound-rating", type: "rating" },
        { display: "", className: "recording-list-view", type: "icon" },
        { display: "", className: "recording-list-queue", type: "icon" },
        { display: "", className: "recording-list-play", type: "icon" },
    ];
    ListRoot.call(this, columns, [ "recording-list-root" ]);

    let expandRow = (recording) => {
        let selected = document.getElementById(recording.id);
        selected.classList.add("list-row-expanded");
        let next = selected.nextElementSibling;
        for (let track of recording.tracks) {
            let data = {
                values: [
                    "",
                    track.title,
                    "",
                    new Rating("track", track.filename, track.rating),
                    null,
                    null,
                    { name: "playlist_add", action: e => api.queue(track) },
                    null,
                ],
                action: null
            }
            let row = this.createRow(data, [ "track-" + recording.id, "list-row-expanded" ]);
            (next != null) ? this.root.insertBefore(row.root, next) : this.root.append(row.root);
        }
    }

    let collapseRow = (recordingId) => {
        let selected = document.getElementById(recordingId);
        selected.classList.remove("list-row-expanded");
        let tracks = Array.from(document.getElementsByClassName("track-" + recordingId));
        for (let track of tracks)
            track.remove();
    }

    let playRecording = (entry) => {
        this.api.clearCurrentPlaylist();
        this.api.getRecording(entry.id, this.api.queueRecording);
        this.api.start();
    };

    this.getData = (entry) => {
        return {
            id: entry.id,
            values: [
                entry.artist,
                entry.title,
                entry.recording_date,
                new Rating("recording-rating", entry.id, entry.rating),
                new Rating("recording-sound-rating", entry.id, entry.sound_rating),
                { name: "album", action: e => window.location.href = "/recording/" + entry.id },
                { name: "playlist_add", action: e => this.api.getRecording(entry.id, this.api.queueRecording) },
                { name: "playlist_play", action: e => playRecording(entry) },
            ],
            action: {
                expand: e => this.api.getRecording(entry.id, expandRow),
                collapse: e => collapseRow(entry.id)
            }
        };
    }

    this.refresh = function(query) { this.api.query(this.api.recording, query, this.update.bind(this)); }

    let search = new SearchBar([ "recording-list-search" ], this.refresh.bind(this));
    this.root.append(search.root);

    this.addHeading();

    document.title = "Browse Recordings";
    this.api.getAllRecordings(this.addRows.bind(this));
    this.api.getSearchConfig(this.api.recording, search.configure);
}
RecordingList.prototype = new Container;

export { RecordingList };

