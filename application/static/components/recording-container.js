import { Recording, Importer } from "/static/modules/api.js";

class RecordingContainer extends HTMLDivElement {

    constructor() {
        super();

        this.id = "recording-container";

        this.directory = this.getAttribute("directory");
        this.recordingId = window.location.href.split("/").pop();
        this.importerApi = new Importer(this.recordingId);
        this.recordingApi = new Recording(this.recordingId);

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
        this.edit = this.createButton("Edit")
        this.edit.onclick = e => {
            elem.setAttribute("context", "edit");
            elem.getDirectoryListing();
            elem.getRecordingInfoFromNotes();
            elem.update();
        };

        this.save = this.createButton("Save");
        this.save.onclick = e => {
            elem.setAttribute("context", "display");
            elem.saveRecording();
            elem.update();
        };

        this.cancel = this.createButton("Cancel");
        this.cancel.onclick = e => {
            elem.setAttribute("context", "display");
            elem.tracklist.resetTracks();
            elem.update();
        };

        this.add = this.createButton("Add to Library");
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

    createButton(text) {
        let button = document.createElement("button");
        button.innerText = text;
        button.name = this.recordingId;
        return button;
    }

    getDirectoryListing() {
        let context = this.getAttribute("context");
        let callback = response => {
            this.directoryListing = response;
            if (this.getAttribute("context") == "edit")
                this.dispatchEvent(new CustomEvent("update-files"));
        }
        (context == "import") ? this.importerApi.get(callback) : this.recordingApi.getDirectoryListing(callback);
    }

    getRecordingInfoFromNotes(source = null) {
        let context = this.getAttribute("context");
        let callback = response => {
            this.recordingInfoFromNotes = response;
            if (this.getAttribute("context") == "import") {
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
        }
        (context == "import") ? this.importerApi.getRecording(source, callback) : this.recordingApi.getFromNotes(callback);
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
        this.info.save();
        this.recordingApi.addToLibrary(this.createPayload());
    }

    saveRecording() {
        this.tracklist.saveTracks();
        this.info.save();
        this.recordingApi.saveRecording(this.createPayload());
    }

    updateRating(data) { this.recordingApi.updateRating(data); }
}

export { RecordingContainer }
