import { TracklistContainer } from "/static/components/tracklist-container.js";

class RecordingTracksContainer extends TracklistContainer {

    constructor() {
        super();

        this.id = "recording-tracklist";
        this.childClass = "recording-track";
        this.childAttributes = [ "position", "title", "filename", "recording-id", "rating" ];

        // Edit elements
        this.options    = document.createElement("div");
        this.options.id = "recording-tracklist-options";

        this.shift           = document.createElement("button");
        this.shift.innerText = "Shift names up";
        this.shift.onclick   = e => this.shiftNamesUp();

        this.reapply           = document.createElement("button");
        this.reapply.innerText = "Reapply names";
        this.reapply.onclick   = e => this.dispatchEvent(new CustomEvent("reapply-names", { bubbles: true }));

        this.options.append(this.shift);
        this.options.append(this.reapply);
    }

    initialize(directory) { 
        this.directory = directory;
        this.rawInfo = document.getElementById("recording-raw-info");
        this.rawInfo.initialize(directory);
        this.tracklist = Array.from(document.getElementsByClassName(this.childClass));
    }

    update(context) {
        (context == "display") ? this.options.remove() : this.insertBefore(this.options, this.rawInfo);
        for (let track of this.tracklist)
            track.update(context);
        if (context != "display") {
            this.tracklist[0].querySelector("[class~='move-up']").style.display = "none";
            this.tracklist[this.tracklist.length - 1].querySelector("[class~='move-down']").style.display = "none";
        }
        this.rawInfo.update(context);
    }

    setText(text) { this.rawInfo.rawText.textContent = text; }

    addNotes(directory, files) { this.rawInfo.addNotes(directory, files); }

    shiftTrackUp(position) {
        super.shiftTrackUp(position);
        for (let track of this.getElementsByClassName(this.childClass))
            track.updateTrackNum();
    }

    shiftNamesUp() {
        let original = Array.from(this.getElementsByClassName(this.childClass)).map(item => item.getName());
        let newNames = original.slice(1, original.length).concat("");
        this.setNames(newNames);
    }

    setNames(names) {
        let tracks = this.getElementsByClassName(this.childClass);
        for (let i = 0; i < tracks.length; i++) {
            let name = (i < names.length) ? names[i] : "";
            tracks.item(i).setName(name);
        }
    }

    reset() {
        for (let track of this.getElementsByClassName(this.childClass))
            track.remove();
        for (let track of this.tracklist)
            this.insertBefore(track, this.options);
    }

    save() {
        for (let track of this.getElementsByClassName(this.childClass))
            track.save();
    }

    getTracklist() {
        let tracks = this.getElementsByClassName(this.childClass);
        let data = [ ];
        for (let track of tracks)
            data.push(track.asObject());
        return data;
    }
}

export { RecordingTracksContainer };
