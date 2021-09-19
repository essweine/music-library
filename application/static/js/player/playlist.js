import { Container } from "../container.js";
import { Tracklist, Playlist, TracklistEntry } from "../shared/tracklist.js";
import { Icon, RatingDisplay } from "../shared/widgets.js";

function makeExpandable(tracklist, viewOffset) {

    tracklist.data.viewOffset = viewOffset;
    tracklist.data.tracklistHidden = true;

    let toggle = document.createElement("div");
    toggle.classList.add("list-toggle");
    toggle.onclick = e => {
        tracklist.data.tracklistHidden = !tracklist.data.tracklistHidden;
        tracklist.updateView(tracklist.data.current + tracklist.data.viewOffset);
    };

    tracklist.updateView = (first) => {
        toggle.remove();
        let action = (tracklist.data.tracklistHidden) ? "Expand" : "Collapse";
        let more = tracklist.data.tracks.length - first - 1;
        if (more == 1)
            toggle.innerText = action + " (" + more + " more track)";
        else if (more > 1)
            toggle.innerText = action + " (" + more + " more tracks)";

        for (let track of tracklist.data.tracks) {
            if (track.data.position < first)
                track.hide();
            else if (track.data.position > first)
                (tracklist.data.tracklistHidden) ? track.hide() : track.show();
            else {
                track.root.style["font-size"] = "large";
                track.moveUp.hide();
            }
            if (track.data.position == first + 1)
                tracklist.root.insertBefore(toggle, track.root);
        }
    }
}

function PlayerTracklist() {

    Playlist.call(this, "player-playlist");

    this.highlightCurrent = function() {
        if (this.data.current < this.data.tracks.length)
            this.data.tracks[this.data.current].root.classList.add("playlist-entry-current");
    }

    this.update = function(state, updateDisplay) {
        this.clear();
        this.setTracklist(state.entries.map(entry => entry.info));
        this.data.current = state.position;
        updateDisplay();
    }

    this.shiftTrackUp = function(position) { this.sendTask(this.createTask("move", { original: position, destination: position - 1 })); }

    this.removeTrack = function(position) { this.sendTask(this.createTask("remove", { position: position })); }
}
PlayerTracklist.prototype = new Tracklist;

function HistoryTrack(track, move, remove, prefix) {

    TracklistEntry.call(this, track, move, remove, prefix);

    this.addText(track.title, "playlist-title");
    this.addText(track.recording, "playlist-recording");
    this.addText(track.artist, "playlist-artist");

    let rating = new RatingDisplay(this.createRating("track", track.filename, track.rating), [ "history-rating" ]);
    this.root.append(rating.root);

    let count = (track.count > 1) ? "x " + track.count : "";
    this.addText(count, "history-count");
}
HistoryTrack.prototype = new TracklistEntry;

function HistoryTracklist() {

    Tracklist.call(this, "player-playlist", HistoryTrack);

    this.setTracklist = function(tracks) {
        this.clear();
        tracks.map(track => this.addTrack(track));
        this.updateView(0);
    }

    this.addTrack = function(track) { this.addEntry(track, "playlist"); }

    this.update = function() { this.getRecentTracks(1800, this.setTracklist.bind(this)); }
}
HistoryTracklist.prototype = new Tracklist;

function CurrentPlaylist() {

    Container.init.call(this, "div", "player-playlist");
    this.data = {
        shuffle: null,
        repeat: null,
    }

    let nextTracks   = new PlayerTracklist();
    let recentTracks = new HistoryTracklist();
    let allTracks    = new PlayerTracklist();

    nextTracks.addHeading("Next Tracks", "next-tracks-heading");
    makeExpandable(nextTracks, 1);
    recentTracks.addHeading("Recently Played", "recent-heading");
    makeExpandable(recentTracks, 0);

    let heading = this.createElement("div", "playlist-heading");

    let showNext = this.createElement("div", "show-split-view");
    showNext.innerText = "Show Next/Recent Tracks";

    let showAll = this.createElement("div", "show-all-tracks");
    showAll.innerText = "Show All Tracks";

    this.updateView = (showAllTracks) => {
        if (showAllTracks) {
            showAll.remove();
            nextTracks.root.remove();
            recentTracks.root.remove();
            allTracks.prependItem(heading);
            this.root.append(allTracks.root);
        } else {
            allTracks.root.remove();
            this.root.append(nextTracks.root);
            this.root.append(recentTracks.root);
            this.root.append(showAll);
        }
    }
    showNext.onclick = e => this.updateView(false);
    showAll.onclick = e => this.updateView(true);

    let controls = this.createElement("div", "playlist-controls");

    let shuffleIcon = new Icon("shuffle", e => this.shuffleCurrentPlaylist(), [ "control-icon" ]);
    let repeatIcon  = new Icon("loop", e => this.repeatCurrentPlaylist(), [ "control-icon" ]);
    let clearIcon   = new Icon("clear", e => this.clearCurrentPlaylist(), [ "control-icon" ]);

    for (let icon of [ shuffleIcon, repeatIcon, clearIcon ])
        controls.append(icon.root);

    heading.append(showNext);
    heading.append(controls);
    allTracks.root.append(heading);

    this.update = function(state) {
        (state.shuffled) ? shuffleIcon.root.classList.remove("disabled-icon") : shuffleIcon.root.classList.add("disabled-icon");
        (state.repeat) ? repeatIcon.root.classList.remove("disabled-icon") : repeatIcon.root.classList.add("disabled-icon");
        nextTracks.update(state, nextTracks.updateView.bind(nextTracks, state.position + 1));
        allTracks.update(state, allTracks.highlightCurrent.bind(allTracks))
        recentTracks.update();
    }

    this.updateView(false);
}
CurrentPlaylist.prototype = Container;

export { CurrentPlaylist };
