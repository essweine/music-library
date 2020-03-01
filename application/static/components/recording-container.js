import { Recording, Importer } from "/static/modules/api.js";

class RecordingContainer extends HTMLDivElement {

    constructor() {
        super();

        this.id = "recording-container";

        this.recordingId  = window.location.href.split("/").pop();
        this.directory    = this.getAttribute("directory");
        this.importerApi  = new Importer(this.recordingId);
        this.recordingApi = new Recording(this.recordingId);

        this.directoryListing;
        this.recordingInfoFromNotes;

        this.editButton           = this.createButton("Edit")
        this.editButton.onclick   = e => this.edit();
        this.saveButton           = this.createButton("Save");
        this.saveButton.onclick   = e => this.save();
        this.cancelButton         = this.createButton("Cancel");
        this.cancelButton.onclick = e => this.cancel();
        this.addButton            = this.createButton("Add to Library");
        this.addButton.onclick    = e => this.addToLibrary();

        this.addEventListener("select-file", e => this.getRecordingInfoFromNotes(e.detail));
        this.addEventListener("reapply-names", e => {
            let names = this.recordingInfoFromNotes.tracks.map(track => track.title);
            this.tracklist.setNames(names); 
        });
    }

    initialize() {

        this.overview  = document.getElementById("recording-overview");
        this.image     = document.getElementById("recording-image");
        this.info      = document.getElementById("recording-info");
        this.tracklist = document.getElementById("recording-tracklist");

        this.info.initialize(this.recordingId);
        this.image.initialize(this.directory);
        this.tracklist.initialize(this.directory);
    }

    edit() {
        this.image.add(this.directory, this.directoryListing.images);
        this.tracklist.addNotes(this.directory, this.directoryListing.text);
        this.setAttribute("context", "edit");
        this.update();
    }

    save() {
        this.info.save();
        this.tracklist.save();
        this.recordingApi.saveRecording(this.createPayload());
        this.setAttribute("context", "display");
        this.update();
    }

    cancel() {
        this.tracklist.reset();
        this.setAttribute("context", "display");
        this.update();
    }

    update() {
        let context = this.getAttribute("context");
        if (context == "display") {
            this.addButton.remove();
            this.saveButton.remove();
            this.cancelButton.remove();
            this.overview.append(this.editButton);
        } else if (context == "import") {
            this.overview.append(this.addButton);
        } else if (context == "edit") {
            this.editButton.remove();
            this.overview.append(this.saveButton);
            this.overview.append(this.cancelButton);
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
        let callback = response => this.directoryListing = response;
        (context == "import") ? this.importerApi.get(callback) : this.recordingApi.getDirectoryListing(callback);
    }

    getRecordingInfoFromNotes(source = null) {
        let context = this.getAttribute("context");
        let callback = response => {
            this.recordingInfoFromNotes = response;
            if (this.getAttribute("context") == "import") {
                let names = this.recordingInfoFromNotes.tracks.map(track => track.title);
                this.tracklist.setNames(names); 
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
        this.tracklist.save();
        this.info.save();
        this.recordingApi.addToLibrary(this.createPayload());
    }
}

export { RecordingContainer }
