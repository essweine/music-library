import { Container } from "../container.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Options } from "../shared/widgets.js";

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
            rowId: null,
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
            rowId: entry.id,
            expand: { getRows: this.getRecordingTracks, createRow: getTrackData },
        };
    }
    ListRoot.call(this, columns, getRecordingData, id);
}
RecordingList.prototype = new ListRoot;

function SuggestionList(prefix, getRecordings) {

    Container.init.call(this, "div", prefix + "-recordings");

    let officialList = new RecordingList(prefix + "-recordings-official");
    officialList.addHeading();
    getRecordings.call(this, true, officialList.update.bind(officialList));
    let nonofficialList = new RecordingList(prefix + "-recordings-nonofficial");
    nonofficialList.addHeading();
    getRecordings.call(this, false, nonofficialList.update.bind(nonofficialList));

    let options = new Options([ "suggestion-options" ], prefix + "-options");
    let updateView = (official) => {
        if (official) {
            nonofficialList.root.remove();
            this.root.append(officialList.root);
        } else {
            officialList.root.remove();
            this.root.append(nonofficialList.root);
        }
    }
    options.addOption("Official", updateView.bind(this, true));
    options.addOption("Nonofficial", updateView.bind(this, false));
    this.root.append(options.root);
    this.root.append(officialList.root);
}
SuggestionList.prototype = Container;

function RecordingBrowser() {

    Container.init.call(this, "div", "recording-browser");

    let recordingList = new RecordingList("recording-list-root");

    let cleared = function(query) {
        return query.match.length == 0 && query.exclude.length == 0 && query.official && query.nonofficial && !query.unrated;
    }

    recordingList.refresh = (query = search.currentQuery()) => {
        if (!cleared(query))
            this.query(this.recordingApi, query, recordingList.update.bind(recordingList));
        else
            recordingList.update([ ]);
    }

    let search = new SearchBar("recording-list-search", this.recordingApi, recordingList.refresh.bind(recordingList));
    recordingList.root.append(search.root);
    recordingList.addHeading();

    let onThisDate = new SuggestionList("on-this-date", this.onThisDate);
    let unlistened = new SuggestionList("unlistened", this.unlistened);
    let randomRecordings = new SuggestionList("random", this.randomRecordings);

    let updateContent = (show, hide) => {
        for (let content of hide)
            content.root.remove();
        this.root.append(show.root);
    }

    let options = new Options([ ], "recording-list-select");
    options.addOption("Search", e => updateContent(recordingList, [ onThisDate, unlistened, randomRecordings ]));
    options.addOption("On This Date", e => updateContent(onThisDate, [ recordingList, unlistened, randomRecordings ]));
    options.addOption("Never Listened", e => updateContent(unlistened, [ recordingList, onThisDate, randomRecordings ]));
    options.addOption("Random", e => updateContent(randomRecordings, [ recordingList, unlistened, onThisDate ]), true);

    this.root.append(options.root);
    this.root.append(randomRecordings.root);

    document.title = "Browse Recordings";
};
RecordingBrowser.prototype = Container;

export { RecordingList, RecordingBrowser };

