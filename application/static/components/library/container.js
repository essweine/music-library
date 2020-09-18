import { createRecordingImage } from "./recording-image.js";
import { createEditableInfo } from "./editable-info.js";
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

    container.recordingTitle  = createEditableInfo("recording-data");
    container.recordingArtist = createEditableInfo("recording-data");
    container.recordingDate   = createEditableInfo("recording-data");
    container.recordingVenue  = createEditableInfo("recording-data");
    container.recordingGenre  = createEditableInfo("recording-data");

    container.infoFields = [ 
        container.recordingTitle,
        container.recordingArtist,
        container.recordingDate,
        container.recordingVenue,
        container.recordingGenre
    ];
    for (let elem of container.infoFields)
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

    container.createIcon = createIcon.bind(container);

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

        for (let field of container.infoFields)
            field.toggleEdit(editable);
        container.tracklist.toggleEdit(editable);

        if (editable) {
            container.infoContainer.append(container.official);
            let official = document.getElementById("official-checkbox");
            official.checked = container.source.official;
        } else
            container.official.remove();
        
        if (typeof(container.imageContainer.toggleEdit) != "undefined")
            container.imageContainer.toggleEdit(editable);
        if (typeof(container.rawInfo.toggleEdit) != "undefined")
            container.rawInfo.toggleEdit(editable);
    }

    container.update = () => {
        for (let elem of container.infoFields)
            elem.save();
        container.tracklist.save();

        container.source.title = container.recordingTitle.get();
        container.source.artist = container.recordingArtist.get();
        container.source.recording_date = container.recordingDate.get();
        container.source.venue = container.recordingVenue.get();
        container.source.genre = container.recordingGenre.get();
        container.source.tracks = container.tracklist.getTracklist();

        let official = document.getElementById("official-checkbox").checked;
        container.source.official = official;

        if (container.data.images.length) {
            let img = document.getElementById("recording-artwork").getAttribute("src")
            container.source.artwork = decodeURIComponent(img.replace(/^\/file\//, ""));
        }
    }

    container.addInfoFromSource = () => {
        container.recordingTitle.initialize(container.source.title, "title", "Title");
        container.recordingArtist.initialize(container.source.artist, "artist", "Artist");
        container.recordingDate.initialize(container.source.recording_date, "recording-date", "Date");
        container.recordingVenue.initialize(container.source.venue, "venue", "Venue");
        container.recordingGenre.initialize(container.source.genre, "genre", "Genre");
        container.tracklist.setTracklist(container.source.tracks);
        container.tracklist.toggleEdit(true);
    }

    container.updateFiles = (directory) => {
        container.data = directory;
        for (let image of directory.images.filter(i => i != container.source.artwork))
            container.imageContainer.addImage(image, container.data.relative_path);
        for (let file of directory.text.filter(f => f != container.source.notes))
            container.rawInfo.addFile(file, container.data.relative_path);
    }

    return container;
}

function createImportContainer(app) {

    let container = createRecordingDisplay();

    container.initialize = (directory) => {

        container.data = directory;
        container.source = (directory.text.length) ? directory.parsed_text[0] : directory.parsed_text[directory.parsed_text.length - 1];
        container.heading.innerText = directory.relative_path;

        container.importIcon = container.createIcon("add", e => container.addToLibrary());
        container.cancelIcon = container.createIcon("clear", e => container.cancel());

        container.overview.append(container.importIcon);
        container.overview.append(container.cancelIcon);

        container.addImages(directory.images, directory.relative_path);
        container.addFiles(directory.text, directory.relative_path);
        container.addInfoFromSource();

        container.toggleEdit(true);
        document.title = directory.relative_path;
    }

    container.addToLibrary = () => {
        container.update();
        app.recordingApi.addToLibrary(container.source);
    }

    container.cancel = () => { window.location.href = "/importer"; }

    app.container = container;
}

function createRecordingContainer(app) {

    let container = createRecordingDisplay();

    container.tracklist.queueTrack = (track) => app.playerApi.queue(track);

    container.initialize = (recording) => {

        container.data = null;
        container.source = recording;
        container.heading.innerText = recording.title;

        let images = (recording.artwork != null) ? [ recording.artwork ] : [ ];
        container.addImages(images, recording.directory);

        let files = (recording.notes != null) ? [ recording.notes ] : [ ];
        container.addFiles(files, recording.directory);
        container.addInfoFromSource();

        container.recordingRating = createRatingContainer("recording-rating", "Rating");
        container.recordingRating.configure(recording.id, "rating", recording.rating, "Rating");

        container.soundRating = createRatingContainer("recording-rating");
        container.soundRating.configure(recording.id, "sound-rating", recording.sound_rating, "Sound Rating");

        container.editIcon = container.createIcon("create", e => container.selectContext(true));
        container.saveIcon = container.createIcon("save", e => container.save());
        container.cancelIcon = container.createIcon("clear", e => container.cancel());

        container.playIcon = container.createIcon("play_arrow", e => {
            app.playerApi.clearPlaylist();
            app.playerApi.queueAll(container.source.tracks)
            app.playerApi.start();
        });
        container.queueIcon = container.createIcon("playlist_play", e => app.playerApi.queueAll(container.source.tracks));

        container.selectContext(false);
        document.title = recording.title;
    }

    container.selectContext = (editable) => {

        if (editable && container.data == null) {
            app.importerApi.getDirectoryListing(encodeURIComponent(container.source.directory), container.updateFiles.bind(container));
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
        app.recordingApi.saveRecording(container.source);
    }

    container.cancel = () => {
        for (let elem of container.infoFields)
            elem.reset();
        container.tracklist.setTracklist(container.source.tracks);
        container.selectContext(false);
    }

    app.container = container;
}

export { createImportContainer, createRecordingContainer };
