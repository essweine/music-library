import { Container, ContainerDefinition } from "../application.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
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

    let playRecording = (entry) => {
        this.api.clearCurrentPlaylist();
        this.api.getRecording(entry.id, this.api.queueRecording);
        this.api.start();
    };

    let getTrackData = (track) => {
        return {
            values: [
                "",
                track.title,
                "",
                new Rating("track", track.filename, track.rating),
                null,
                null,
                { name: "playlist_add", action: e => this.api.queue(track) },
                null,
            ],
            expand: null,
        };
    }

    let getRecordingData = (entry) => {
        return {
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
            expand: { id: entry.id, getRows: this.api.getRecordingTracks, createRow: getTrackData },
        };
    }
    ListRoot.call(this, columns, getRecordingData, "recording-list-root");

    this.refresh = function(query) { this.api.query(this.api.recording, query, this.update.bind(this)); }

    let search = new SearchBar("recording-list-search", this.api.recording, this.refresh.bind(this));
    this.root.append(search.root);

    this.addHeading();

    document.title = "Browse Recordings";
}
RecordingList.prototype = new Container;

export { RecordingList };

