class RecordingContainer extends HTMLDivElement {
    constructor() {
        super();

        this.id =  "recording-container";
        this.recordingId = window.location.href.split("/").pop();
        this.directory   = this.getAttribute("directory");

        this.directoryListing;
        this.originalRecordingInfo;

        this.addEventListener("select-file", e => this.getRecordingInfoForImport(e.detail, true));
        this.addEventListener("reapply-titles", e => { 
            let names = this.originalRecordingInfo.tracks.map(track => track.title);
            this.tracklist.setTitles(names); 
        });

        let elem = this;
        this.edit = document.createElement("button");
        this.edit.innerText = "Edit";
        this.edit.name = this.recordingId;
        this.edit.onclick = e => {
            elem.setAttribute("context", "edit");
            elem.update();
        }

        this.save = document.createElement("button");
        this.save.innerText = "Save";
        this.save.name = this.recordingId;

        this.cancel = document.createElement("button");
        this.cancel.innerText = "Cancel";
        this.cancel.name = this.recordingId;
        this.cancel.onclick = e => {
            elem.setAttribute("context", "display");
            elem.tracklist.resetTracks();
            elem.update();
        }

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
            this.getRecordingInfoForImport();
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
        }
        this.image.update(context);
        this.info.update(context);
        this.tracklist.update(context);
    }

    getDirectoryListing() {
        let request = new XMLHttpRequest();
        request.open("GET", "/api/importer/" + this.recordingId);
        request.addEventListener("load", e => this.directoryListing = JSON.parse(e.target.response));
        request.send();
    }

    getRecordingInfoForImport(source = null, update = false) {
        let request = new XMLHttpRequest();
        let url = "/api/importer/" + this.recordingId + "?as=recording";
        if (source != null)
            url += "&source=" + encodeURIComponent(source);
        request.open("GET", url);
        request.addEventListener("load", e => {
            this.originalRecordingInfo = JSON.parse(e.target.response);
            if (update) {
                console.log(this.originalRecordingInfo);
                let names = this.originalRecordingInfo.tracks.map(track => track.title);
                this.tracklist.setTitles(names);
                this.info.set(
                    this.originalRecordingInfo.title,
                    this.originalRecordingInfo.artist,
                    this.originalRecordingInfo.recording_date,
                    this.originalRecordingInfo.venue,
                );
            }
        })
        request.send();
    }

    createPayload() {
        let data = this.originalRecordingInfo;
        data.title = this.info.get("title");
        data.artist = this.info.get("artist");
        data.recording_date = this.info.get("recording-date");
        data.venue = this.info.get("venue");
        data.artwork = this.image.get();
        data.tracks = this.tracklist.getTracklist();
        return data;
    }

    addToLibrary() {
        let data = this.createPayload();
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => window.location = "/recording/" + this.recordingId);
        request.open("POST", "/api/recording/" + this.recordingId);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(data));
    }
}

export { RecordingContainer }
