import { TracklistContainer } from "/static/components/tracklist-container.js";
import { createRecordingTrack } from "/static/components/recording-tracklist-entry.js";

class RecordingTracksContainer extends TracklistContainer {

    constructor() {
        super();

        this.id = "recording-tracklist";
        this.childClass = "recording-track";

        this.options    = document.createElement("div");
        this.options.id = "recording-tracklist-options";

        this.shift           = document.createElement("button");
        this.shift.innerText = "Shift names up";
        this.shift.onclick   = e => this.shiftTitlesUp();
        this.options.append(this.shift);

        this.reapply           = document.createElement("button");
        this.reapply.innerText = "Reapply names";
        this.reapply.onclick   = e => this.dispatchEvent(new CustomEvent("reapply-titles", { bubbles: true }));
        this.options.append(this.reapply);

        this.append(this.options);
    }

    toggleEdit(editable) {
        for (let track of this.getElementsByClassName(this.childClass))
            track.toggleEdit(editable);
        (editable) ?  this.insertBefore(this.options, this.rawInfo) : this.options.remove();
    }

    setTracklist(tracks) {
        super.clear();
        for (let track of tracks) {
            let entry = createRecordingTrack(track);
            let position = track.track_num - 1;
            entry.updatePosition(position, position == 0, position == tracks.length - 1);
            this.insertBefore(entry, this.options);
        }
    }

    getTracklist() {
        return Array.from(this.getElementsByClassName(this.childClass)).map(item => item.track);
    }

    shiftTrackUp(position) { super.shiftTrackUp(position); }

    shiftTitlesUp() {
        let original = Array.from(this.getElementsByClassName(this.childClass)).map(item => item.trackTitle.get());
        let newTitles = original.slice(1, original.length).concat("");
        this.setTrackTitles(newTitles);
    }

    setTrackTitles(titles) {
        let tracks = this.getElementsByClassName(this.childClass);
        for (let i = 0; i < tracks.length; i++) {
            let title = (i < titles.length) ? titles[i] : "";
            tracks.item(i).trackTitle.set(title);
        }
    }

    save() {
        for (let track of this.getElementsByClassName(this.childClass))
            track.save();
    }
}

function createRecordingTracklist() { return document.createElement("div", { is: "recording-tracklist" }); }

export { RecordingTracksContainer, createRecordingTracklist };
