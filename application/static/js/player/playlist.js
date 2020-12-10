import { Container, ContainerDefinition } from "../application.js";
import { Tracklist, Playlist, TracklistEntry } from "../shared/tracklist.js";
import { Icon, RatingDisplay } from "../shared/widgets.js";
import { Task, Rating } from "../api.js";

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

    this.highlightCurrent = () => this.data.tracks[this.data.current].root.classList.add("playlist-entry-current");

    this.update = (state, updateDisplay) => {
        this.clear();
        this.setTracklist(state.playlist);
        this.data.current = state.current;
        updateDisplay();
    }

    this.shiftTrackUp = (position) => {
        this.api.sendTasks([ new Task("move", { original: position, destination: position - 1 }) ]);
    }

    this.removeTrack = (position) => {
        this.api.sendTasks([ new Task("remove", { position: position }) ]);
    }
}
PlayerTracklist.prototype = new Container;

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

function HistoryTracklist() {

    Tracklist.call(this, "player-playlist", HistoryTrack);

    this.setTracklist = function(tracks) {
        this.clear();
        tracks.map(track => this.addTrack(track));
        this.updateView(0);
    }

    this.addTrack = function(track) { this.addEntry(track, "playlist"); }

    this.update = function() { this.api.getRecentTracks(1800, this.setTracklist.bind(this)); }
}
HistoryTracklist.prototype = new Container;

function CurrentPlaylist() {

    let def = new ContainerDefinition("div", [ ], "player-playlist");
    let data = {
        shuffle: null,
        repeat: null,
    }
    Container.call(this, data, def);

    let nextTracks   = new PlayerTracklist();
    let recentTracks = new HistoryTracklist();
    let allTracks    = new PlayerTracklist();

    nextTracks.addHeading("Next Tracks", "next-tracks-heading");
    makeExpandable(nextTracks, 1);
    recentTracks.addHeading("Recently Played", "recent-heading");
    makeExpandable(recentTracks, 0);

    let heading = document.createElement("div");
    heading.id = "playlist-heading";

    let showNext = document.createElement("div");
    showNext.id = "show-split-view";
    showNext.innerText = "Show Next/Recent Tracks";

    let showAll = document.createElement("div");
    showAll.id = "show-all-tracks";
    showAll.innerText = "Show All Tracks";

    let updateView = (showAllTracks) => {
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
    showNext.onclick = e => updateView(false);
    showAll.onclick = e => updateView(true);

    let controls = document.createElement("div");
    controls.id = "playlist-controls";

    let shuffleIcon = new Icon("shuffle", e => this.api.shuffleCurrentPlaylist(), [ "control-icon" ]);
    let repeatIcon  = new Icon("loop", e => this.api.repeatCurrentPlaylist(), [ "control-icon" ]);
    let clearIcon   = new Icon("clear", e => this.api.clearCurrentPlaylist(), [ "control-icon" ]);

    for (let icon of [ shuffleIcon, repeatIcon, clearIcon ])
        controls.append(icon.root);

    heading.append(showNext);
    heading.append(controls);
    allTracks.root.append(heading);

    this.update = function(state) {
        (state.shuffle) ? shuffleIcon.root.classList.remove("disabled-icon") : shuffleIcon.root.classList.add("disabled-icon");
        (state.repeat) ? repeatIcon.root.classList.remove("disabled-icon") : repeatIcon.root.classList.add("disabled-icon");
        nextTracks.update(state, nextTracks.updateView.bind(nextTracks, state.current + 1));
        allTracks.update(state, allTracks.highlightCurrent.bind(allTracks))
        recentTracks.update();
    }

    updateView(false);
}
CurrentPlaylist.prototype = new Container;

export { CurrentPlaylist };
