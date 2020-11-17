import { Container, ContainerDefinition } from "../application.js";
import { Icon } from "./widgets.js";

function TracklistEntry(track, move, remove, prefix) {

    let def = new ContainerDefinition("div", [ "tracklist-entry" ]);
    Container.call(this, { track: track }, def);

    this.moveUp      = new Icon("arrow_upward", e => move(this.data.position), [ prefix + "-move-up" ]);
    this.moveDown    = new Icon("arrow_downward", e => move(this.data.position + 1), [ prefix + "-move-down" ]);
    this.removeTrack = new Icon("clear", e => remove(this.data.position), [ prefix + "-remove-track" ]);

    this.updatePosition = function(position, firstTrack, lastTrack) {
        this.data.position = position;
        if (firstTrack && lastTrack) {
            this.moveUp.hide();
            this.moveDown.hide();
        } else if (firstTrack) {
            this.moveUp.hide();
            this.moveDown.show();
        } else if (lastTrack) {
            this.moveUp.show();
            this.moveDown.hide();
        } else {
            this.moveUp.show();
            this.moveDown.show();
        }
    }

    this.hide = () => this.root.style.display = "none";
    this.show = () => this.root.style.display = "contents";
}
TracklistEntry.prototype = new Container;

function Tracklist(id, entryType = TracklistEntry) {

    let def = new ContainerDefinition("div", [ ], id);
    let data = { tracks: [ ] };
    Container.call(this, data, def);

    this.addEntry = function(track, prefix) {
        let entry = new entryType(
            track,
            this.shiftTrackUp.bind(this),
            this.removeTrack.bind(this),
            prefix
        );
        let position = this.data.tracks.length;
        let firstTrack = (position == 0) ? true : false;
        if (!firstTrack) {
            let prev = this.data.tracks.length - 1;
            this.data.tracks[prev].updatePosition(prev, prev == 0, false);
        }
        entry.updatePosition(position, firstTrack, true);
        this.root.append(entry.root);
        this.data.tracks.push(entry);
        return entry;
    }

    this.getTracklist = function() { return this.data.tracks.map(entry => entry.data.track); }

    this.clear = function() {
        this.data.tracks.map(entry => entry.root.remove());
        this.data.tracks = [ ];
    }

    this.shiftTrackUp = function(position) {
        let entry = this.data.tracks.splice(position, 1)[0];
        let prev = this.data.tracks[position - 1];
        this.data.tracks.splice(position - 1, 0, entry);
        this.root.removeChild(entry.root);
        this.root.insertBefore(entry.root, prev.root);
        entry.updatePosition(position - 1, position - 1 == 0, position - 1 == this.data.tracks.length - 1);
        prev.updatePosition(position, position == 0, position == this.data.tracks.length - 1);
    }

    this.removeTrack = function(position) {
        let entry = this.data.tracks.splice(position, 1)[0];
        entry.root.remove();
        for (let i = position; i < this.data.tracks.length; i++)
            this.data.tracks[i].updatePosition(i, i == 0, i == this.data.tracks.length - 1);
    }

    this.createOption = function(text, className, selectedClass, action) {
        let span = document.createElement("span");
        span.innerText = text;
        span.classList.add(className);
        span.onclick = () => {
            Array.from(document.getElementsByClassName(selectedClass)).map(e => e.classList.remove(selectedClass));
            span.classList.add(selectedClass);
            action();
        }
        return span;
    }
}
Tracklist.prototype = new Container;

function Playlist(id) {

    Tracklist.call(this, id);

    this.setTracklist = function(tracks) { tracks.map(track => this.addTrack(track)); }

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
        entry.root.append(entry.moveUp.root);
        entry.root.append(entry.moveDown.root);
        entry.root.append(entry.removeTrack.root);
    }
}
Playlist.prototype = new Container;

export { TracklistEntry, Tracklist, Playlist };
