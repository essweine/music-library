import { Container, ContainerDefinition } from "../application.js";
import { Playlist } from "../shared/tracklist.js";
import { Icon } from "../shared/widgets.js";
import { Task } from "../api.js";

function TracklistControls() {

    let def = new ContainerDefinition("div", [ ], "playlist-controls");
    let data = {
        shuffle: null,
        repeat: null,
    };
    Container.call(this, data, def);

    let shuffleIcon = new Icon("shuffle", e => this.api.shuffleCurrentPlaylist(), [ "control-icon" ]);
    let repeatIcon  = new Icon("loop", e => this.api.repeatCurrentPlaylist(), [ "control-icon" ]);
    let clearIcon   = new Icon("clear", e => this.api.clearCurrentPlaylist(), [ "control-icon" ]);

    for (let icon of [ shuffleIcon, repeatIcon, clearIcon ])
        this.root.append(icon.root);

    this.update = (shuffle, repeat) => {
        (shuffle) ? shuffleIcon.root.classList.remove("disabled-icon") : shuffleIcon.root.classList.add("disabled-icon");
        (repeat) ? repeatIcon.root.classList.remove("disabled-icon") : repeatIcon.root.classList.add("disabled-icon");
    }
}
TracklistControls.prototype = new Container;

function CurrentPlaylist() {

    Playlist.call(this, "player-tracklist");

    this.data.current = 0;
    this.data.currentView = "nextTracks";
    this.data.tracklistHidden = true;

    let heading = document.createElement("div");
    heading.classList.add("tracklist-heading");

    let view = document.createElement("div");
    view.id = "playlist-view";

    let updateView = (view) => function() {
        this.data.currentView = view;
        this.updateDisplay();
    };

    let headingClass = "tracklist-heading-option";
    let selectedClass = "tracklist-heading-selected";
    let nextTracksView = this.createOption("Next Tracks", headingClass, selectedClass, updateView("nextTracks").bind(this));
    nextTracksView.classList.add("tracklist-heading-selected");
    view.append(nextTracksView);
    let playlistView = this.createOption("All Tracks", headingClass, selectedClass, updateView("allTracks").bind(this));
    view.append(playlistView);
    heading.append(view);

    let controls = new TracklistControls();
    heading.append(controls.root);
    this.root.append(heading);

    let listToggle = document.createElement("div");
    listToggle.classList.add("list-toggle");
    listToggle.onclick = e => {
        this.data.tracklistHidden = !this.data.tracklistHidden;
        this.updateDisplay();
    };

    this.updateDisplay = function() {
        for (let track of this.data.tracks) {
            if (this.data.currentView == "allTracks") {
                track.show();
                track.root.style["font-size"] = "medium";
                if (track.data.position == this.data.current)
                    track.root.classList.add("playlist-entry-current");
                if (track.data.position != 0)
                    track.moveUp.show();
            } else {
                if (track.data.position <= this.data.current) {
                    track.hide();
                } else if (track.data.position == this.data.current + 1) {
                    track.root.style["font-size"] = "large";
                    track.moveUp.hide();
                } else {
                    (this.data.tracklistHidden) ? track.hide() : track.show();
                }
            }
        }
        if (this.data.currentView == "nextTracks") {
            let more = this.data.tracks.length - this.data.current - 1;
            if (more > 0) {
                let action = (this.data.tracklistHidden) ? "Expand" : "Collapse";
                if (more > 1)
                    listToggle.innerText = action + " (" + more + " more tracks)";
                else if (more == 1)
                    listToggle.innerText = action + " (" + more + " more track)";
                this.root.insertBefore(listToggle, this.data.tracks[this.data.current + 2].root);
            }
        } else { listToggle.remove(); }
    }

    this.update = function(state) {
        this.clear();
        this.data.current = state.current;
        this.setTracklist(state.playlist);
        this.updateDisplay();
        controls.update(state.shuffle, state.repeat);
    }

    this.shiftTrackUp = (position) => {
        this.api.sendTasks([ new Task("move", { original: position, destination: position - 1 }) ]);
    }

    this.removeTrack = (position) => {
        this.api.sendTasks([ new Task("remove", { position: position }) ]);
    }
}
CurrentPlaylist.prototype = new Container;

export { CurrentPlaylist };
