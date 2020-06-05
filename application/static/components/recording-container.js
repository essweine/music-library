import { Recording, Importer, Player } from "/static/modules/api.js";
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
        this.playerApi = new Player();
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

        this.editIcon   = this.createIcon("create", e => this.toggleEdit(true));
        this.playIcon   = this.createIcon("play_arrow", e => this.playerApi.playAll(this.source.tracks));
        this.queueIcon  = this.createIcon("playlist_play", e => this.playerApi.queueAll(this.source.tracks));
        this.saveIcon   = this.createIcon("save", e => this.save());
        this.cancelIcon = this.createIcon("clear", e => this.cancel());
        this.addIcon    = this.createIcon("add", e => this.addToLibrary());

        this.addEventListener("select-file", e => {
            let filename = e.detail;
            this.source = this.data.parsed_text[this.data.text.indexOf(filename)];
            this.addInfoFromSource();
        });

        this.addEventListener("reapply-titles", e => {
            let original = this.source.tracks.map(item => item.title);
            this.tracklist.setTrackTitles(original);
        });

        this.addEventListener("play-track", e => { this.playerApi.play(e.detail); });
        this.addEventListener("queue-track", e => this.playerApi.queue(e.detail));
    }

    toggleEdit(editable) {

        if (editable && this.data == null) {
            let importApi = new Importer();
            importApi.getDirectoryListing(this.source.directory, this.updateFiles.bind(this));
        }

        if (this.context == "recording" && editable) {
            this.editIcon.remove();
            this.playIcon.remove();
            this.queueIcon.remove();
            this.recordingRating.remove();
            this.soundRating.remove();
            this.overview.append(this.saveIcon);
            this.overview.append(this.cancelIcon);
        } else if (this.context == "recording") {
            this.saveIcon.remove();
            this.cancelIcon.remove();
            this.overview.append(this.editIcon);
            this.overview.append(this.playIcon);
            this.overview.append(this.queueIcon);
            this.infoContainer.append(this.recordingRating);
            this.infoContainer.append(this.soundRating);
        } else if (this.context == "import" && editable) {
            this.overview.append(this.addIcon);
            this.overview.append(this.cancelIcon);
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
        this.toggleEdit(true);
    }

    addSection(divId) {
        let elem = document.createElement("div");
        elem.id = divId;
        this.append(elem);
        return elem;
    }

    createIcon(iconName, action) {
        let icon = document.createElement("span");
        icon.innerText = iconName;
        icon.onclick = action;
        icon.classList.add("material-icons");
        return icon;
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

    document.title = directory.relative_path;
    let container = document.createElement("div", { is: "recording-container" });
    container.data = directory;
    container.context = "import";

    let heading = document.createElement("span");
    heading.id = "recording-heading";
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

    document.title = recording.title;
    let container = document.createElement("div", { is: "recording-container" });
    container.context = "recording";

    let heading = document.createElement("span");
    heading.id = "recording-heading";
    heading.innerText = recording.title;
    heading.style["padding-right"] = "20px";
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
