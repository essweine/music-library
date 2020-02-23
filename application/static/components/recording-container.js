import { Recording } from "/static/modules/recording.js";

class RecordingContainer extends HTMLDivElement {
    constructor() {
        super();

        this.recordingApi = new Recording();

        this.id =  "recording-container";
        this.recordingId = window.location.href.split("/").pop();
        this.directory   = this.getAttribute("directory");

        this.directoryListing;
        this.recordingInfoFromNotes;

        this.addEventListener("select-file", e => this.getRecordingInfoFromNotes(e.detail));
        this.addEventListener("reapply-titles", e => { 
            let names = this.recordingInfoFromNotes.tracks.map(track => track.title);
            this.tracklist.setInputValues(names); 
            this.tracklist.setTitleAttributes(names); 
        });
        this.addEventListener("update-files", e => {
            this.image.add(this.directory, this.directoryListing.images);
            this.tracklist.addNotes(this.directory, this.directoryListing.text);
        });
        this.addEventListener("update-rating", e => this.updateRating(e.detail));

        let elem = this;
        this.edit = document.createElement("button");
        this.edit.innerText = "Edit";
        this.edit.name = this.recordingId;
        this.edit.onclick = e => {
            elem.setAttribute("context", "edit");
            elem.getDirectoryListing();
            elem.getRecordingInfoFromNotes();
            elem.update();
        };

        this.save = document.createElement("button");
        this.save.innerText = "Save";
        this.save.name = this.recordingId;
        this.save.onclick = e => {
            this.tracklist.saveTracks();
            this.info.save();
            elem.setAttribute("context", "display");
            elem.update();
            elem.saveRecording();
        };

        this.cancel = document.createElement("button");
        this.cancel.innerText = "Cancel";
        this.cancel.name = this.recordingId;
        this.cancel.onclick = e => {
            elem.setAttribute("context", "display");
            elem.tracklist.resetTracks();
            elem.update();
        };

        this.add = document.createElement("button");
        this.add.innerText = "Add to Library";
        this.add.name = this.recordingId;
        this.add.onclick = e => this.addToLibrary();
    }

    initialize() {

        this.overview  = document.getElementById("recording-overview");
        this.toggle    = document.getElementById("recording-action");
        this.image     = document.getElementById("recording-image");
        this.info      = document.getElementById("recording-info");
        this.tracklist = document.getElementById("tracklist-container");

        let context = this.getAttribute("context");
        if (context == "import") {
            this.getDirectoryListing();
            this.getRecordingInfoFromNotes();
        }
        this.image.initialize(this.directory);
        this.tracklist.initialize(this.directory);
    }

    update() {
        let context = this.getAttribute("context");
        if (context == "display") {
            this.add.remove();
            this.save.remove();
            this.cancel.remove();
            this.overview.append(this.edit);
        } else if (context == "import") {
            this.overview.append(this.add);
        } else if (context == "edit") {
            this.edit.remove();
            this.overview.append(this.save);
            this.overview.append(this.cancel);
        }
        this.image.update(context);
        this.info.update(context);
        this.tracklist.update(context);
    }

    getDirectoryListing() {
        let context = this.getAttribute("context");
        let url;
        if (context == "import")
            url = "/api/importer/" + this.recordingId;
        else
            url = "/api/recording/" + this.recordingId + "/entry";
        let request = new XMLHttpRequest();
        request.open("GET", url);
        request.addEventListener("load", e => {
            this.directoryListing = JSON.parse(e.target.response);
            if (context == "edit") {
                let ev = new CustomEvent("update-files");
                this.dispatchEvent(ev);
            }
        });
        request.send();
    }

    getRecordingInfoFromNotes(source = null) {
        let context = this.getAttribute("context");
        let url;
        if (context == "import") {
            url = "/api/importer/" + this.recordingId + "?as=recording";
            if (source != null)
                url += "&source=" + encodeURIComponent(source);
        } else {
            url = "/api/recording/" + this.recordingId + "/notes";
        }
        let request = new XMLHttpRequest();
        request.open("GET", url);
        request.addEventListener("load", e => {
            this.recordingInfoFromNotes = JSON.parse(e.target.response);
            if (context == "import") {
                let names = this.recordingInfoFromNotes.tracks.map(track => track.title);
                this.tracklist.setInputValues(names); 
                this.tracklist.setTitleAttributes(names); 
                this.info.set(
                    this.recordingInfoFromNotes.title,
                    this.recordingInfoFromNotes.artist,
                    this.recordingInfoFromNotes.recording_date,
                    this.recordingInfoFromNotes.venue,
                );
            }
        })
        request.send();
    }

    createPayload() {
        let data = this.recordingInfoFromNotes;
        data.title = this.info.get("title");
        data.artist = this.info.get("artist");
        data.recording_date = this.info.get("recording-date");
        data.venue = this.info.get("venue");
        data.rating = this.info.get("rating");
        data.sound_rating = this.info.get("sound-rating");
        data.artwork = this.image.get();
        data.tracks = this.tracklist.getTracklist();
        return data;
    }

    addToLibrary() {
        this.tracklist.saveTracks();
        let data = this.createPayload();
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => window.location = "/recording/" + this.recordingId);
        request.open("POST", "/api/recording/" + this.recordingId);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(data));
    }

    saveRecording() {
        let data = this.createPayload();
        let request = new XMLHttpRequest();
        request.open("PUT", "/api/recording/" + this.recordingId);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(data));
    }

    updateRating(data) { this.recordingApi.updateRating(this.recordingId, data); }
}

export { RecordingContainer }
