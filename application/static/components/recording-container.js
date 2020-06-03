import { Recording, Importer } from "/static/modules/api.js";
import { createRecordingImage } from "/static/components/recording-image.js";
import { createEditableInfo } from "/static/components/editable-info.js";
import { createRatingContainer } from "/static/components/rating-container.js";
import { createRecordingTracklist } from "/static/components/recording-tracklist.js";
import { createRecordingRawInfo } from "/static/components/recording-raw-info.js";

class RecordingContainer extends HTMLDivElement {

    constructor() {
        super();

        this.id = "recording-container";
        this.recordingApi = new Recording();
        this.data = null;
        this.source = null;
        this.context = null;

        this.overview       = this.addSection("recording-overview");
        this.imageContainer = this.addSection("recording-image");
        this.infoContainer  = this.addSection("recording-info");

        this.tracklist      = createRecordingTracklist();
        this.append(this.tracklist);

        this.rawInfo = this.addSection("recording-raw-info");

        this.recordingTitle  = createEditableInfo("recording-data");
        this.recordingArtist = createEditableInfo("recording-data");
        this.recordingDate   = createEditableInfo("recording-data");
        this.recordingVenue  = createEditableInfo("recording-data");

        this.recordingRating = createRatingContainer();
        this.recordingRating.setLabel("Rating");

        this.soundRating = createRatingContainer();
        this.soundRating.setLabel("Sound Rating");

        for (let elem of [ this.recordingTitle, this.recordingArtist, this.recordingDate, this.recordingVenue ])
            this.infoContainer.append(elem);

        this.editButton   = this.createButton("Edit", e => this.toggleEdit(true));
        this.saveButton   = this.createButton("Save", e => this.save());
        this.cancelButton = this.createButton("Cancel", e => this.cancel());
        this.addButton    = this.createButton("Add to Library", e => this.addToLibrary());

        this.addEventListener("select-file", e => {
            let filename = e.detail;
            this.source = this.data.parsed_text[this.data.text.indexOf(filename)];
            this.addInfoFromSource();
        });

        this.addEventListener("reapply-titles", e => {
            let original = this.source.tracks.map(item => item.title);
            this.tracklist.setTrackTitles(original);
        });
    }

    toggleEdit(editable) {

        if (editable && this.data == null) {
            let importApi = new Importer();
            importApi.getDirectoryListing(this.source.directory, this.updateFiles.bind(this));
        }

        if (this.context == "recording" && editable) {
            this.editButton.remove();
            this.recordingRating.remove();
            this.soundRating.remove();
            this.overview.append(this.saveButton);
            this.overview.append(this.cancelButton);
        } else if (this.context == "recording") {
            this.saveButton.remove();
            this.cancelButton.remove();
            this.overview.append(this.editButton);
            this.infoContainer.append(this.recordingRating);
            this.infoContainer.append(this.soundRating);
        } else if (this.context == "import" && editable) {
            this.overview.append(this.addButton);
            this.overview.append(this.cancelButton);
        }

        this.recordingTitle.toggleEdit(editable);
        this.recordingArtist.toggleEdit(editable);
        this.recordingDate.toggleEdit(editable);
        this.recordingVenue.toggleEdit(editable);
        this.tracklist.toggleEdit(editable);
        
        if (typeof(this.imageContainer.toggleEdit) != "undefined")
            this.imageContainer.toggleEdit(editable);
        if (typeof(this.rawInfo.toggleEdit) != "undefined")
            this.rawInfo.toggleEdit(editable);
    }

    cancel() {
        if (this.context == "recording") {
            for (let elem of [ this.recordingTitle, this.recordingArtist, this.recordingDate, this.recordingVenue ])
                elem.reset();
            this.tracklist.setTracklist(this.source.tracks);
            this.toggleEdit(false);
        } else
            window.location.href = "/importer";
    }

    update() {
        for (let elem of [ this.recordingTitle, this.recordingArtist, this.recordingDate, this.recordingVenue ])
            elem.save();
        this.tracklist.save();

        this.source.title = this.recordingTitle.get();
        this.source.artist = this.recordingArtist.get();
        this.source.recording_date = this.recordingDate.get();
        this.source.venue = this.recordingVenue.get();
        this.source.tracks = this.tracklist.getTracklist();

        if (this.data.images.length)
            this.source.artwork = document.getElementById("recording-artwork").getAttribute("src").replace(/^\/file\//, "");
    }

    save() {
        this.update();
        this.recordingApi.saveRecording(this.source);
    }

    addToLibrary() {
        this.update();
        this.recordingApi.addToLibrary(this.source);
    }

    addInfoFromSource() {
        this.recordingTitle.initialize(this.source.title, "title", "Title");
        this.recordingArtist.initialize(this.source.artist, "artist", "Artist");
        this.recordingDate.initialize(this.source.recording_date, "recording-date", "Date");
        this.recordingVenue.initialize(this.source.venue, "venue", "Venue");
        this.tracklist.setTracklist(this.source.tracks);
    }

    addSection(divId) {
        let elem = document.createElement("div");
        elem.id = divId;
        this.append(elem);
        return elem;
    }

    createButton(text, action) {
        let button = document.createElement("button");
        button.innerText = text;
        button.onclick = action;
        return button;
    }

    updateFiles(directory) {
        this.data = directory;
        for (let image of directory.images.filter(i => i != this.source.artwork))
            this.imageContainer.addImage(image, this.data.relative_path);
        for (let file of directory.text.filter(f => f != this.source.notes))
            this.rawInfo.addFile(file, this.data.relative_path);
    }
}

function importRecording(directory) {

    let container = document.createElement("div", { is: "recording-container" });
    container.data = directory;
    container.context = "import";

    let heading = document.createElement("span");
    heading.innerText = directory.relative_path;
    container.overview.append(heading);

    if (directory.images.length) {
        let image = createRecordingImage(directory.images, directory.relative_path);
        container.replaceChild(image, container.imageContainer);
        container.imageContainer = image;
    } else
        container.imageContainer.innerText = "No images available";

    if (directory.text.length) {
        let rawInfo = createRecordingRawInfo(directory.text, directory.relative_path)
        container.replaceChild(rawInfo, container.rawInfo);
        container.rawInfo = rawInfo;
        container.source = directory.parsed_text[0];
    } else {
        container.rawInfo.innerText = "No notes available";
        container.source = directory.parsed_text[directory.parsed_text.length - 1];
    }
    container.addInfoFromSource();
    container.toggleEdit(true);

    let content = document.getElementById("content");
    content.append(container);
}

function viewRecording(recording) {

    let container = document.createElement("div", { is: "recording-container" });
    container.context = "recording";

    let heading = document.createElement("span");
    heading.innerText = recording.title;
    container.overview.append(heading);

    if (recording.artwork != null) {
        let image = createRecordingImage([ recording.artwork ], recording.directory, recording.artwork);
        container.replaceChild(image, container.imageContainer);
        container.imageContainer = image;
    } else
        container.imageContainer.innerText = "No images available";

    if (recording.notes != null) {
        let rawInfo = createRecordingRawInfo([ recording.notes ], recording.directory, recording.notes)
        container.replaceChild(rawInfo, container.rawInfo);
        container.rawInfo = rawInfo;
    } else
        container.rawInfo.innerText = "No notes available";

    container.source = recording;
    container.addInfoFromSource();
    container.toggleEdit(false);
    container.recordingRating.initialize(recording.id, "rating", recording.rating);
    container.soundRating.initialize(recording.id, "sound-rating", recording.sound_rating);

    let content = document.getElementById("content");
    content.append(container);
}

export { RecordingContainer, importRecording, viewRecording };
