import { Container, ContainerDefinition } from "../application.js";
import { RatingDisplay } from "../shared/widgets.js";
import { Tracklist, TracklistEntry } from "../shared/tracklist.js";
import { Rating } from "../api.js";

function HistoryTrack(track, move, remove, prefix) {

    TracklistEntry.call(this, track, move, remove, prefix);

    let addText = (text, className) => {
        let span = document.createElement("span");
        span.classList.add(className);
        span.innerText = text;
        this.root.append(span);
    }
    addText(track.title, "playlist-title");
    addText(track.recording, "playlist-recording");
    addText(track.artist, "playlist-artist");

    let rating = new RatingDisplay(new Rating("track", track.filename, track.rating), [ "history-rating" ]);
    this.root.append(rating.root);

    let count = (track.count > 1) ? "x " + track.count : "";
    addText(count, "history-count");
}

function RecentlyPlayedTracklist() {

    Tracklist.call(this, "recently-played", HistoryTrack);
    this.data.period = 1800;
    this.addHeading("Recently Played", "recent-heading");

    let options = document.createElement("div");
    options.classList.add("history-select");

    let text = document.createElement("span");
    text.classList.add("history-intro");
    text.innerText = "Show";
    options.append(text);

    let headingClass = "history-option";
    let selectedClass = "history-option-selected";
    let updateView = (period) => function() { 
        this.api.getRecentTracks(period, this.setTracklist.bind(this));
        this.data.period = period
    }
    let span30  = this.createOption("30 minutes", headingClass, selectedClass, updateView(1800).bind(this));
    let span60  = this.createOption("1 hour", headingClass, selectedClass, updateView(3600).bind(this));
    let span120 = this.createOption("2 hours", headingClass, selectedClass, updateView(7200).bind(this));
    let spanDay = this.createOption("1 day", headingClass, selectedClass, updateView(86400).bind(this));

    [ span30, span60, span120, spanDay ].map(option => options.append(option));
    span30.classList.add(selectedClass);

    this.setTracklist = function(tracks) {
        this.clear();
        options.remove();
        tracks.map(track => this.addTrack(track));
        this.root.append(options);
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

    let options = document.createElement("div");
    options.classList.add("history-select");

    let text = document.createElement("span");
    text.classList.add("history-intro");
    text.innerText = "Show";
    options.append(text);

    let headingClass = "history-option";
    let selectedClass = "history-option-selected";
    let updateView = (numTracks) => function() { 
        this.api.getFrequentTracks(numTracks, this.setTracklist.bind(this));
        this.data.numTracks = numTracks
    }
    for (let n of [ 10, 25, 50, 100 ]) {
        let option = this.createOption(n, headingClass, selectedClass, updateView(n).bind(this));
        options.append(option);
        if (n == 10)
            option.classList.add("history-option-selected");
    }

    this.setTracklist = function(tracks) {
        this.clear();
        options.remove();
        tracks.map(track => this.addTrack(track));
        this.root.append(options);
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

export { PlayerHistory };
