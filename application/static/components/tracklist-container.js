class TracklistContainer extends HTMLDivElement {
    constructor() {
        super();
        this.id = "tracklist-container";
        this.addEventListener("move-track", e => { this.shiftTrackUp(e.detail); });

        this.options    = document.createElement("div");
        this.options.id = "tracklist-options";

        this.shift           = document.createElement("button");
        this.shift.innerText = "Shift names up";
        this.shift.onclick   = e => this.shiftNamesUp();
        this.options.append(this.shift);

        this.reapply           = document.createElement("button");
        this.reapply.innerText = "Reapply names";
        this.reapply.onclick   = e => {
            let ev = new CustomEvent("reapply-titles", { bubbles: true });
            this.dispatchEvent(ev);
        };
        this.options.append(this.reapply);
    }

    initialize(directory) {
        this.directory = directory;
        this.tracks  = this.querySelectorAll("[is='tracklist-entry']");
        this.rawInfo = document.getElementById("raw-recording-info");
        this.rawInfo.initialize(directory);
    }

    update(context) {
        this.rawInfo.update(context);
        for (let track of this.tracks)
            track.update(context);
        if (context == "display") {
            this.options.remove();
        } else {
            let tracks = this.querySelectorAll("[is='tracklist-entry']");
            tracks.item(0).querySelector("[class~='move-up']").style.display = "none";
            tracks.item(this.tracks.length - 1).querySelector("[class~='move-down']").style.display = "none";
            this.insertBefore(this.options, this.rawInfo);
        }
    }

    shiftTrackUp(trackNum) {
        let listPosition = trackNum - 1;
        let tracks = this.querySelectorAll("[is='tracklist-entry']");
        let atEnd = listPosition == tracks.length - 1;
        let item = tracks.item(listPosition);
        let prev = tracks.item(listPosition - 1);
        this.removeChild(item);
        this.insertBefore(item, prev);
        item.updateTrackNum(trackNum - 1);
        prev.updateTrackNum(trackNum, atEnd);
    }

    shiftNamesUp() {
        let tracks = this.querySelectorAll("[is='tracklist-entry']");
        let original = Array.from(tracks).map(item => item.querySelector("[class~='tracklist-input']").value);
        let newNames = original.slice(1, original.length).concat("");
        this.setInputValues(newNames);
    }

    setInputValues(names) {
        let tracks = this.querySelectorAll("[is='tracklist-entry']");
        for (let i = 0; i < this.tracks.length; i++) {
            let input = tracks.item(i).querySelector("[class~='tracklist-input']");
            input.value = (names.length >= tracks.length) ? names[i] : "";
        }
    }

    setTitleAttributes(names) {
        let tracks = this.querySelectorAll("[is='tracklist-entry']");
        for (let i = 0; i < this.tracks.length; i++)
            tracks.item(i).setAttribute("title", (names.length >= tracks.length) ? names[i] : "");
    }

    resetTracks() {
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks.item(i);
            track.updateTrackNum(i + 1);
            this.insertBefore(track, this.options);
        }
    }

    saveTracks() {
        let tracks = this.querySelectorAll("[is='tracklist-entry']");
        let names = Array.from(tracks).map(item => item.querySelector("[class~='tracklist-input']").value);
        this.setTitleAttributes(names);
        this.tracklist = tracks;
    }

    getTracklist() {
        let tracks = this.querySelectorAll("[is='tracklist-entry']");
        let data = [ ];
        for (let track of tracks)
            data.push(track.asObject());
        return data;
    }

    setText(text) { this.rawInfo.rawText.textContent = text; }

    addNotes(directory, files) { this.rawInfo.addNotes(directory, files); }
}

export { TracklistContainer };
