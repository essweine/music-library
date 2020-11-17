import { Container, ContainerDefinition } from "../application.js";
import { RatingDisplay } from "../shared/widgets.js";
import { Tracklist } from "../shared/tracklist.js";
import { Rating } from "../api.js";

function RecentlyPlayedTracklist() {

    Tracklist.call(this, "recently-played");
    this.data.period = 1800;

    let heading = document.createElement("div");
    heading.id = "recent-heading";
    heading.classList.add("section-heading");
    heading.innerText = "Recently Played"
    this.root.append(heading);

    let options = document.createElement("div");
    options.id = "recent-select";

    let text = document.createElement("span");
    text.classList.add("recent-intro");
    text.innerText = "Show";
    options.append(text);

    let headingClass = "recent-period";
    let selectedClass = "recent-period-selected";
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

    this.addTrack = function(track) {
        let entry = this.addEntry(track, "playlist");
        let addText = function(text, className) {
            let span = document.createElement("span");
            span.classList.add(className);
            span.innerText = text;
            entry.root.append(span);
        }
        addText(track.title, "playlist-title");
        addText(track.recording, "playlist-recording");
        addText(track.artist, "playlist-artist");
        let rating = new RatingDisplay(new Rating("track", track.filename, track.rating), [ "recent-rating" ]);
        entry.root.append(rating.root);
        let count = (track.count > 1) ? "x " + track.count : "";
        addText(count, "recent-count");
    }


    let ws = this.getNotificationService(this.api.playerNotification);
    ws.addEventListener("message", e => this.api.getRecentTracks(this.data.period, this.setTracklist.bind(this)));

    document.title = "Player History";
    this.api.getRecentTracks(this.data.period, this.setTracklist.bind(this));
}
RecentlyPlayedTracklist.prototype = new Container;

export { RecentlyPlayedTracklist };
