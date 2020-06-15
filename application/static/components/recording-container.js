import { Importer } from "/static/modules/api.js";
import { createRecordingImage } from "/static/components/recording-image.js";
import { createEditableInfo } from "/static/components/editable-info.js";
import { createRatingContainer } from "/static/components/rating-container.js";
import { createRecordingTracklist } from "/static/components/recording-tracklist.js";
import { createRecordingRawInfo } from "/static/components/recording-raw-info.js";
import { createIcon } from "/static/modules/util.js";


function addSection(sectionId, container) {
    let section = document.createElement("div");
    section.id = sectionId;
    container.append(section);
    return section;
}

function createRecordingDisplay() {

    let container = document.createElement("div");
    container.id = "recording-container";

    container.overview       = addSection("recording-overview", container);
    container.imageContainer = addSection("recording-image", container);
    container.infoContainer  = addSection("recording-info", container);

    container.tracklist = createRecordingTracklist();
    container.append(container.tracklist);

    container.rawInfo = addSection("recording-raw-info", container);

    container.recordingTitle  = createEditableInfo("recording-data");
    container.recordingArtist = createEditableInfo("recording-data");
    container.recordingDate   = createEditableInfo("recording-data");
    container.recordingVenue  = createEditableInfo("recording-data");

    container.infoFields = [ 
        container.recordingTitle,
        container.recordingArtist,
        container.recordingDate,
        container.recordingVenue
    ];
    for (let elem of container.infoFields)
        container.infoContainer.append(elem);

    container.heading = document.createElement("span");
    container.heading.id = "recording-heading";
    container.heading.style["padding-right"] = "20px";
    container.overview.append(container.heading);

    container.addEventListener("select-file", e => {
        let filename = e.detail;
        container.source = container.data.parsed_text[container.data.text.indexOf(filename)];
        container.addInfoFromSource();
    });

    container.addEventListener("reapply-titles", e => {
        let original = container.source.tracks.map(item => item.title);
        container.tracklist.setTrackTitles(original);
    });

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
            let rawInfo = createRecordingRawInfo(files, baseDir);
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
        container.source.tracks = container.tracklist.getTracklist();

        if (container.data.images.length)
            container.source.artwork = document.getElementById("recording-artwork").getAttribute("src").replace(/^\/file\//, "");
    }

    container.addInfoFromSource = () => {
        container.recordingTitle.initialize(container.source.title, "title", "Title");
        container.recordingArtist.initialize(container.source.artist, "artist", "Artist");
        container.recordingDate.initialize(container.source.recording_date, "recording-date", "Date");
        container.recordingVenue.initialize(container.source.venue, "venue", "Venue");
        container.tracklist.setTracklist(container.source.tracks);
        container.toggleEdit(true);
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

function createImportContainer() {

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
        container.dispatchEvent(new CustomEvent("add-recording", { detail: container.source, bubbles: true }));
    }

    container.cancel = () => { window.location.href = "/importer"; }

    return container;
}

function createRecordingContainer() {

    let container = createRecordingDisplay();

    container.initialize = (recording) => {

        container.data = null;
        container.source = recording;
        container.heading.innerText = recording.title;

        let images = (recording.artwork != null) ? [ recording.artwork ] : [ ];
        container.addImages(images, recording.directory);

        let files = (recording.notes != null) ? [ recording.notes ] : [ ];
        container.addFiles(files, recording.directory);
        container.addInfoFromSource();

        container.recordingRating = createRatingContainer();
        container.recordingRating.classList.add("recording-rating");
        container.recordingRating.initialize(recording.id, "rating", recording.rating, "Rating");

        container.soundRating = createRatingContainer();
        container.soundRating.classList.add("recording-rating");
        container.soundRating.initialize(recording.id, "sound-rating", recording.sound_rating, "Sound Rating");

        container.editIcon = container.createIcon("create", e => container.selectContext(true));
        container.saveIcon = container.createIcon("save", e => container.save());
        container.cancelIcon = container.createIcon("clear", e => container.cancel());

        container.playIcon = container.createIcon("play_arrow", 
            e => container.dispatchEvent(new CustomEvent("play-tracks", { detail: container.source.tracks, bubbles: true })) );
        container.queueIcon = container.createIcon("playlist_play", 
            e => container.dispatchEvent(new CustomEvent("queue-tracks", { detail: container.source.tracks, bubbles: true })) );

        container.selectContext(false);
        document.title = recording.title;
    }

    container.selectContext = (editable) => {

        if (editable && container.data == null) {
            let importApi = new Importer();
            importApi.getDirectoryListing(container.source.directory, container.updateFiles.bind(container));
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
        container.dispatchEvent(new CustomEvent("save-recording", { detail: container.source, bubbles: true }));
    }

    container.cancel = () => {
        for (let elem of container.infoFields)
            elem.reset();
        container.tracklist.setTracklist(container.source.tracks);
        container.selectContext(false);
    }

    return container;
}

export { createImportContainer, createRecordingContainer };
