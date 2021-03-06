import { Container } from "../container.js";
import { Icon } from "./widgets.js";

function TracklistEntry(track, move, remove, prefix) {

    Container.init.call(this, "div", null, [ "tracklist-entry" ]);
    this.data = { track: track };

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

    this.addText = (text, className) => {
        let span = this.createElement("span", null, [ className ]);
        span.innerText = text;
        this.root.append(span);
    }
}
TracklistEntry.prototype = Container;

function Tracklist(id, entryType = TracklistEntry) {

    Container.init.call(this, "div", id);
    this.data = { tracks: [ ], current: 0 };

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

    this.addHeading = function(text, id) {
        let heading = this.createElement("span", id, [ "tracklist-heading" ]);
        heading.innerText = text;
        this.root.append(heading);
    }

    this.prependItem = function(item) {
        let first = this.root.firstChild;
        (first != null) ?  this.root.insertBefore(item, first) : this.root.append(item);
    }
}
Tracklist.prototype = Container;

function PlaylistEntry(track, move, remove, prefix) {

    TracklistEntry.call(this, track, move, remove, prefix);

    this.addText(track.title, "playlist-title");
    this.addText(track.recording, "playlist-recording");
    this.addText(track.artist, "playlist-artist");

    this.root.append(this.moveUp.root);
    this.root.append(this.moveDown.root);
    this.root.append(this.removeTrack.root);
}
PlaylistEntry.prototype = new TracklistEntry;

function Playlist(id) {

    Tracklist.call(this, id, PlaylistEntry);

    this.setTracklist = function(tracks) { tracks.map(track => this.addTrack(track)); }
    this.addTrack = function(track) { this.addEntry(track, "playlist"); }
}
Playlist.prototype = new Tracklist;

export { TracklistEntry, Tracklist, Playlist };
