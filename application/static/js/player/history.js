import { Container } from "../container.js";
import { RatingDisplay, Options } from "../shared/widgets.js";
import { ListRoot } from "../shared/list.js";

function HistoryList(listTitle, options, id) {

    let columns = [
        { display: "Title", className: "history-list-title", type: "text" },
        { display: "Recording", className: "history-list-recording", type: "text" },
        { display: "Artist", className: "history-list-artist", type: "text" },
        { display: "Rating", className: "history-list-rating", type: "rating" },
        { display: "Listened", className: "history-list-count", type: "text" },
        { display: "", className: "history-list-queue", type: "icon" },
    ];

    let addHistory = (timestamp) => {
        return {
            values: [ "", timestamp, "", null, "", null ],
            expand: null,
        };
    }

    let createRow = (track) => {
        return {
            values: [
                track.title,
                track.recording,
                track.artist,
                Container.createRating("track", track.filename, track.rating),
                "x" + track.count,
                { name: "playlist_add", action: e => this.queue(track) },
            ],
            expand: { id: track.filename, getRows: this.getTrackHistory, createRow: addHistory },
        };
    };

    ListRoot.call(this, columns, createRow, id);

    let sectionHeading = this.createElement("div", null, [ "history-heading" ]);
    sectionHeading.innerText = listTitle;
    this.root.append(sectionHeading);
    this.addFooter(options.root);
}

function RecentlyPlayedTracklist() {

    let options = new Options([ "history-select" ]);
    options.addText("Show");

    let updateView = (period) => function() { 
        this.getRecentTracks(period, this.update.bind(this));
        this.data.period = period;
    }
    options.addOption("1 hour", updateView(3600).bind(this));
    options.addOption("2 hours", updateView(7200).bind(this));
    options.addOption("4 hours", updateView(14400).bind(this));
    options.addOption("1 day", updateView(86400).bind(this));

    HistoryList.call(this, "Recently Played", options, "recently-played");
    this.data.period = 3600;

    let ws = this.getNotificationService(this.playerNotification);
    ws.addEventListener("message", e => this.getRecentTracks(this.data.period, this.update.bind(this)));
}
RecentlyPlayedTracklist.prototype = new ListRoot;

function FrequentlyPlayedTracklist() {

    let options = new Options([ "history-select" ]);
    options.addText("Show");
    let updateView = (numTracks) => function() {
        this.getFrequentTracks(numTracks, this.update.bind(this));
        this.data.numTracks = numTracks
    }
    options.addOption("10", updateView(10).bind(this));
    options.addOption("25", updateView(25).bind(this));
    options.addOption("50", updateView(50).bind(this));
    options.addOption("100", updateView(100).bind(this));

    HistoryList.call(this, "Frequently Played", options, "frequently-played");
    updateView(10).call(this);
}
FrequentlyPlayedTracklist.prototype = new ListRoot;

function PlayerHistory() {

    Container.init.call(this, "div", "player-history");

    let recent = new RecentlyPlayedTracklist();
    this.root.append(recent.root);

    let frequent = new FrequentlyPlayedTracklist();
    this.root.append(frequent.root);

    document.title = "Player History";
}
PlayerHistory.prototype = Container;

export { PlayerHistory };
