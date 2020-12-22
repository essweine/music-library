import { Container } from "../container.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";

function RecordingList(id) { 

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
        this.clearCurrentPlaylist();
        this.getItem(this.recordingApi, entry.id, this.queueRecording.bind(this));
        this.start();
    };

    let getTrackData = (track) => {
        return {
            values: [
                "",
                track.title,
                "",
                Container.createRating("track", track.filename, track.rating),
                null,
                null,
                { name: "playlist_add", action: e => this.queue(track) },
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
                Container.createRating("recording-rating", entry.id, entry.rating),
                Container.createRating("recording-sound-rating", entry.id, entry.sound_rating),
                { name: "album", action: e => window.location.href = "/recording/" + entry.id },
                { name: "playlist_add", action: e => this.getItem(this.recordingApi, entry.id, this.queueRecording.bind(this)) },
                { name: "playlist_play", action: e => playRecording(entry) },
            ],
            expand: { id: entry.id, getRows: this.getRecordingTracks, createRow: getTrackData },
        };
    }
    ListRoot.call(this, columns, getRecordingData, id);
}
RecordingList.prototype = new ListRoot;

function RecordingBrowser() {
    Container.init.call(this, "div", "recording-browser");
    let recordingList = new RecordingList("recording-list-root");
    recordingList.refresh = function(query) { this.query(this.recordingApi, query, recordingList.update.bind(recordingList)); }
    let search = new SearchBar("recording-list-search", this.recordingApi, recordingList.refresh.bind(recordingList));
    recordingList.root.append(search.root);
    recordingList.addHeading();
    this.root.append(recordingList.root);
    document.title = "Browse Recordings";
};
RecordingBrowser.prototype = Container;

export { RecordingList, RecordingBrowser };

