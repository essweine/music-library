import { createRecordingImage } from "./recording-image.js";
import { createEditableInfo } from "../shared/editable-info.js";
import { createRecordingTaglist } from "./taglist.js";
import { createRecordingTracklist } from "./tracklist.js";
import { createRawInfo } from "./raw-info.js";
import { createRatingContainer } from "/static/components/shared/rating-container.js";
import { createIcon } from "/static/components/shared/icons.js";

function createRecordingDisplay() {

    let container = document.createElement("div");
    container.id = "recording-container";

    let addSection = (sectionId) => {
        let section = document.createElement("div");
        section.id = sectionId;
        container.append(section);
        return section;
    }

    container.overview       = addSection("recording-overview");
    container.imageContainer = addSection("recording-image");
    container.infoContainer  = addSection("recording-info");

    container.tracklist = createRecordingTracklist(container);
    container.append(container.tracklist);

    container.rawInfo = addSection("recording-raw-info");

    let recordingTitle    = createEditableInfo("recording-data");
    let recordingArtist   = createRecordingTaglist("artist", "Artist", container.tracklist);
    let recordingComposer = createRecordingTaglist("composer", "Composer", container.tracklist);
    let recordingDate     = createEditableInfo("recording-data");
    let recordingVenue    = createEditableInfo("recording-data");
    let recordingGenre    = createRecordingTaglist("genre", "Genre", container.tracklist);

    let infoFields = [ recordingTitle, recordingArtist, recordingComposer, recordingDate, recordingVenue, recordingGenre ];

    for (let elem of infoFields)
        container.infoContainer.append(elem);

    container.official = document.createElement("div");
    container.official.classList.add("recording-official");

    let text = document.createElement("span");
    text.innerText = "Official Recording";
    text.style["padding-right"] = "8px";
    container.official.append(text);

    let input = document.createElement("input");
    input.type = "checkbox";
    input.id = "official-checkbox";
    container.official.append(input);

    container.heading = document.createElement("span");
    container.heading.id = "recording-heading";
    container.heading.style["padding-right"] = "20px";
    container.overview.append(container.heading);

    container.addImages = (images, baseDir) => {
        if (images.length) {
            let image = createRecordingImage(images, baseDir, images[0]);
            container.replaceChild(image, container.imageContainer);
            container.imageContainer = image;
        } else {
            container.imageContainer.innerText = "No images available";
        }
    }

    container.addFiles = (files, baseDir) => {
        if (files.length) {
            let rawInfo = createRawInfo(container, files, baseDir);
            container.replaceChild(rawInfo, container.rawInfo);
            container.rawInfo = rawInfo;
        } else {
            container.rawInfo.innerText = "No notes available";
        }
    }

    container.toggleEdit = (editable) => {

        for (let field of infoFields)
            field.toggleEdit(editable);
        container.tracklist.toggleEdit(editable);

        if (editable) {
            container.infoContainer.append(container.official);
            let official = document.getElementById("official-checkbox");
            official.checked = (container.recording == null) ? false : container.recording.official;
        } else
            container.official.remove();
        
        if (typeof(container.imageContainer.toggleEdit) != "undefined")
            container.imageContainer.toggleEdit(editable);
        if (typeof(container.rawInfo.toggleEdit) != "undefined")
            container.rawInfo.toggleEdit(editable);
    }

    container.update = () => {

        for (let elem of infoFields)
            elem.save();
        container.tracklist.save();

        container.recording.title = recordingTitle.get();
        container.recording.recording_date = recordingDate.get();
        container.recording.venue = recordingVenue.get();
        container.recording.tracks = container.tracklist.getTracklist();

        let official = document.getElementById("official-checkbox").checked;
        container.recording.official = official;

        if (container.data.images.length) {
            let img = document.getElementById("recording-artwork").getAttribute("src")
            container.recording.artwork = decodeURIComponent(img.replace(/^\/file\//, ""));
        }
    }

    container.collectProperties = () => {
        recordingArtist.initialize(container.tracklist.getAllValues("artist"));
        recordingComposer.initialize(container.tracklist.getAllValues("composer"));
        recordingGenre.initialize(container.tracklist.getAllValues("genre"));
    }

    container.addInfoFromSource = (source) => {
        recordingTitle.initialize(source.title, "title", "Title");
        recordingDate.initialize(source.recording_date, "recording-date", "Date");
        recordingVenue.initialize(source.venue, "venue", "Venue");
        container.tracklist.setTracklist(source.tracks);
        container.collectProperties();
        container.tracklist.toggleEdit(true);
    }

    container.updateFiles = (directory) => {
        container.data = directory;
        for (let image of directory.images.filter(i => i != container.recording.artwork))
            container.imageContainer.addImage(image, container.data.relative_path);
        for (let file of directory.text.filter(f => f != container.recording.notes))
            container.rawInfo.addFile(file, container.data.relative_path);
    }

    container.reset = () => {
        container.addInfoFromSource(container.recording);
        container.selectContext(false);
    }

    return container;
}

function createImportContainer(app) {

    let container = createRecordingDisplay();

    container.initialize = (directory) => {

        let source = (directory.text.length) ? directory.parsed_text[0] : directory.parsed_text[directory.parsed_text.length - 1];

        container.data = directory;
        container.recording = source;
        container.heading.innerText = directory.relative_path;

        container.importIcon = createIcon("add", e => container.addToLibrary());
        container.cancelIcon = createIcon("clear", e => container.cancel());

        container.overview.append(container.importIcon);
        container.overview.append(container.cancelIcon);

        container.addInfoFromSource(source);
        container.addImages(directory.images, directory.relative_path);
        container.addFiles(directory.text, directory.relative_path);

        container.toggleEdit(true);
        document.title = directory.relative_path;
    }

    container.addToLibrary = () => {
        container.update();
        app.recordingApi.addToLibrary(container.recording);
    }

    container.cancel = () => { window.location.href = "/importer"; }

    app.container = container;
}

function createRecordingContainer(app) {

    let container = createRecordingDisplay();

    container.tracklist.queueTrack = (track) => app.playerApi.queue(track);

    container.initialize = (recording) => {

        container.data = null;
        container.recording = recording;
        container.heading.innerText = recording.title;

        let images = (recording.artwork != null) ? [ recording.artwork ] : [ ];
        container.addImages(images, recording.directory);

        let files = (recording.notes != null) ? [ recording.notes ] : [ ];
        container.addFiles(files, recording.directory);
        container.addInfoFromSource(recording);

        container.recordingRating = createRatingContainer("recording-rating", "Rating");
        container.recordingRating.configure("recording", recording.id, "rating", recording.rating, "Rating");

        container.soundRating = createRatingContainer("recording-rating");
        container.soundRating.configure("recording", recording.id, "sound-rating", recording.sound_rating, "Sound Rating");

        container.editIcon = createIcon("create", e => container.selectContext(true));
        container.saveIcon = createIcon("save", e => container.save());
        container.cancelIcon = createIcon("clear", e => container.cancel());

        container.playIcon = createIcon("play_arrow", e => {
            app.playerApi.clearPlaylist();
            app.playerApi.queueAll(container.recording.tracks)
            app.playerApi.start();
        });
        container.queueIcon = createIcon("playlist_play", e => app.playerApi.queueAll(container.recording.tracks));

        container.selectContext(false);
        document.title = recording.title;
    }

    container.selectContext = (editable) => {

        if (editable && container.data == null) {
            app.importerApi.getDirectoryListing(encodeURIComponent(container.recording.directory), container.updateFiles.bind(container));
        }

        (editable) ? container.editIcon.remove() : container.overview.append(container.editIcon);
        (editable) ? container.playIcon.remove() : container.overview.append(container.playIcon);
        (editable) ? container.queueIcon.remove() : container.overview.append(container.queueIcon);
        (editable) ? container.recordingRating.remove() : container.infoContainer.append(container.recordingRating);
        (editable) ? container.soundRating.remove() : container.infoContainer.append(container.soundRating);

        (editable) ? container.overview.append(container.saveIcon) : container.saveIcon.remove();
        (editable) ? container.overview.append(container.cancelIcon) : container.cancelIcon.remove();

        container.toggleEdit(editable);
    }

    container.save = () => {
        container.update();
        app.recordingApi.saveRecording(container.recording);
    }

    container.cancel = () => container.reset();

    app.container = container;
}

export { createImportContainer, createRecordingContainer };
