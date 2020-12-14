import { Tracklist, TracklistEntry } from "../shared/tracklist.js";
import { Icon, RatingDisplay, EditableInfo } from "../shared/widgets.js";
import { Taglist } from "../shared/taglist.js";

function RecordingTrack(track, move, remove, prefix) {

    TracklistEntry.call(this, track, move, remove, prefix);
    this.data.detailVisible = false;

    let trackNum = this.createElement("span", null, [ "recording-track-position" ]);
    trackNum.innerText = track.track_num;
    this.root.append(trackNum);

    let trackTitle = new EditableInfo([ "recording-track-title" ]);
    trackTitle.configure(track.title, track.filename, track.filename);
    this.root.append(trackTitle.root);

    let rating = new RatingDisplay(this.createRating("track", track.filename, track.rating), [ "recording-track-rating" ]);

    let queueTrack    = new Icon("playlist_add", e => this.queue(track), [ "recording-queue-track" ]);
    let expandTrack   = new Icon("expand_more", e => this.toggleDetail(true), [ "recording-expand-track" ]);
    let collapseTrack = new Icon("expand_less", e => this.toggleDetail(false), [ "recording-collapse-track" ]);

    let tags = { artist: "Artist", guest: "Guest Artist", composer: "Composer", genre: "Genre" };
    let taglist = new Taglist(tags, [ "recording-track-taglist" ]);
    for (let prop of Object.keys(tags))
        track[prop].map(value => taglist.addTag(prop, value));
    this.root.append(taglist.root);

    this.getTaglist = () => { return taglist; }

    this.updatePosition = function(position, firstTrack, lastTrack) {
        this.__proto__.updatePosition.call(this, position, firstTrack, lastTrack);
        trackNum.innerText = position + 1;
        this.data.track.track_num = position + 1;
    }

    this.toggleDetail = function(visible) {
        if (visible) {
            expandTrack.remove();
            this.root.insertBefore(collapseTrack.root, taglist.root);
            taglist.root.style.display = "block";
        } else {
            collapseTrack.remove();
            this.root.insertBefore(expandTrack.root, taglist.root);
            taglist.root.style.display = "none";
        }
    }

    this.toggleEdit = function(editable) {
        trackTitle.toggleEdit(editable);
        taglist.toggleEdit(editable);
        if (editable) {
            rating.remove();
            queueTrack.remove();
            this.root.insertBefore(this.moveUp.root, taglist.root);
            this.root.insertBefore(this.moveDown.root, taglist.root);
        } else {
            this.moveUp.remove();
            this.moveDown.remove();
            this.root.insertBefore(rating.root, taglist.root);
            this.root.insertBefore(queueTrack.root, taglist.root);
        }
        this.toggleDetail(this.data.detailVisible);
    }

    this.save = function() {
        trackTitle.save();
        this.data.track.track_num = this.data.position + 1;
        this.data.track.title = trackTitle.data;
        for (let prop of Object.keys(tags))
            this.data.track[prop] = taglist.getValues(prop);
    }

    this.getCurrentTitle = () => { return trackTitle.currentValue(); }
    this.setTitle = (title) => { trackTitle.set(title); }
    this.reset = () => { trackTitle.reset(); }
}
RecordingTrack.prototype = new TracklistEntry;

function RecordingTracklist() {

    Tracklist.call(this, "recording-tracklist", RecordingTrack);

    let options = this.createElement("div", "recording-tracklist-options");

    let setTrackTitles = function(titles) {
        for (let i = 0; i < this.data.tracks.length; i++) {
            let title = (i < titles.length) ? titles[i] : "";
            this.data.tracks[i].setTitle(title);
        }
    }

    let shift       = document.createElement("button");
    shift.innerText = "Shift names up";
    shift.onclick   = e => {
        let original = this.data.tracks.map(track => track.getCurrentTitle());
        let newTitles = original.slice(1, original.length).concat("");
        setTrackTitles.call(this, newTitles);
    }
    options.append(shift);

    let reapply       = document.createElement("button");
    reapply.innerText = "Reapply names";
    reapply.onclick   = e => {
        let original = this.getTracklist().map(track => track.title);
        setTrackTitles.call(this, original);
    }
    options.append(reapply);

    this.toggleEdit = function(editable) {
        this.data.tracks.map(track => track.toggleEdit(editable));
        (editable) ? this.root.append(options) : options.remove();
    }

    this.setTracklist = function(tracks) {
        this.clear();
        let taglists = [ ];
        for (let track of tracks)
            taglists.push(this.addTrack(track));
        return taglists;
    }

    this.addTrack = function(track) {
        let entry = this.addEntry(track, "recording");
        return entry.getTaglist();
    }

    this.save = function() { this.data.tracks.map(track => track.save()); }
}
RecordingTracklist.prototype = new Tracklist;

export { RecordingTrack, RecordingTracklist };
