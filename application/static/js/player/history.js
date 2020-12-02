import { Container, ContainerDefinition } from "../application.js";
import { RatingDisplay, Options } from "../shared/widgets.js";
import { Tracklist, TracklistEntry } from "../shared/tracklist.js";
import { Rating } from "../api.js";

function HistoryTrack(track, move, remove, prefix) {

    TracklistEntry.call(this, track, move, remove, prefix);

    this.addText(track.title, "playlist-title");
    this.addText(track.recording, "playlist-recording");
    this.addText(track.artist, "playlist-artist");

    let rating = new RatingDisplay(new Rating("track", track.filename, track.rating), [ "history-rating" ]);
    this.root.append(rating.root);

    let count = (track.count > 1) ? "x " + track.count : "";
    this.addText(count, "history-count");
}

function RecentlyPlayedTracklist() {

    Tracklist.call(this, "recently-played", HistoryTrack);
    this.data.period = 3600;
    this.addHeading("Recently Played", "recent-heading");

    let options = new Options([ "history-select" ]);
    options.addText("Show");

    let updateView = (period) => function() { 
        this.api.getRecentTracks(period, this.setTracklist.bind(this));
        this.data.period = period
    }
    options.addOption("1 hour", updateView(3600).bind(this));
    options.addOption("2 hours", updateView(7200).bind(this));
    options.addOption("4 hours", updateView(14400).bind(this));
    options.addOption("1 day", updateView(86400).bind(this));

    this.setTracklist = function(tracks) {
        this.clear();
        options.root.remove();
        tracks.map(track => this.addTrack(track));
        this.root.append(options.root);
    }

    this.addTrack = function(track) { let entry = this.addEntry(track, "playlist"); }

    let ws = this.getNotificationService(this.api.playerNotification);
    ws.addEventListener("message", e => this.api.getRecentTracks(this.data.period, this.setTracklist.bind(this)));

    this.api.getRecentTracks(this.data.period, this.setTracklist.bind(this));
}
RecentlyPlayedTracklist.prototype = new Container;

function FrequentlyPlayedTracklist() {

    Tracklist.call(this, "frequently-played", HistoryTrack);
    this.data.numTracks = 10;
    this.addHeading("Frequently Played", "frequent-heading");

    let options = new Options([ "history-select" ]);
    options.addText("Show");

    let updateView = (numTracks) => function() { 
        this.api.getFrequentTracks(numTracks, this.setTracklist.bind(this));
        this.data.numTracks = numTracks
    }
    options.addOption("10", updateView(10).bind(this));
    options.addOption("25", updateView(25).bind(this));
    options.addOption("50", updateView(50).bind(this));
    options.addOption("100", updateView(100).bind(this));

    this.setTracklist = function(tracks) {
        this.clear();
        options.root.remove();
        tracks.map(track => this.addTrack(track));
        this.root.append(options.root);
    }

    this.addTrack = function(track) { let entry = this.addEntry(track, "playlist"); }

    this.api.getFrequentTracks(this.data.numTracks, this.setTracklist.bind(this));
}
FrequentlyPlayedTracklist.prototype = new Container;

function PlayerHistory() {

    let def = new ContainerDefinition("div", [ ], "player-history");
    Container.call(this, { }, def);

    let recent = new RecentlyPlayedTracklist();
    this.root.append(recent.root);
    let frequent = new FrequentlyPlayedTracklist();
    this.root.append(frequent.root);

    document.title = "Player History";
}
PlayerHistory.prototype = new Container;

export { PlayerHistory, HistoryTrack };
