import { Container } from "../container.js";
import { Icon, RatingDisplay, EditableInfo } from "../shared/widgets.js";
import { RawInfo, RecordingImage } from "./directory.js";
import { AggregateTaglist } from "../shared/taglist.js";
import { RecordingTracklist } from "./recording-tracklist.js";

function Recording(context) {

    Container.init.call(this, "div", "recording-container");
    this.data = {
        context: context,
        recording: { },
        directory: { },
    };

    let addSection = (sectionId) => {
        let section = this.createElement("div", sectionId);
        this.root.append(section);
        return section;
    }
    let overview       = addSection("recording-overview");
    let imageContainer = addSection("recording-image");
    let infoContainer  = addSection("recording-info");

    let tracklist = new RecordingTracklist();
    this.root.append(tracklist.root);

    let rawInfo = addSection("recording-raw-info");

    let recordingTitle    = new EditableInfo([ "recording-data" ]);
    let recordingArtist   = new AggregateTaglist("artist", "Artist", [ "recording-taglist" ]);
    let recordingComposer = new AggregateTaglist("composer", "Composer", [ "recording-taglist" ]);
    let recordingDate     = new EditableInfo([ "recording-data" ]);
    let recordingVenue    = new EditableInfo([ "recording-data" ]);
    let recordingGenre    = new AggregateTaglist("genre", "Genre", [ "recording-taglist" ]);

    let recordingInfo = [ recordingTitle, recordingArtist, recordingComposer, recordingDate, recordingVenue, recordingGenre ];
    recordingInfo.map(elem => infoContainer.append(elem.root));

    let recordingRating = addSection("recording-rating");
    let soundRating     = addSection("recording-sound-rating");

    let officialToggle = document.createElement("div");
    officialToggle.classList.add("recording-official");

    let text = document.createElement("span");
    text.innerText = "Official Recording";
    text.style["padding-right"] = "8px";
    officialToggle.append(text);

    let input = document.createElement("input");
    input.type = "checkbox";
    input.id = "official-checkbox";
    officialToggle.append(input);

    let tagToggle = document.createElement("div");
    tagToggle.classList.add("recording-official");

    let tagText = document.createElement("span");
    tagText.innerText = "Copy album data to file metadata";
    tagText.style["padding-right"] = "8px";
    tagToggle.append(tagText);

    let tagInput = document.createElement("input");
    tagInput.type = "checkbox";
    tagInput.id = "tag-checkbox";
    tagToggle.append(tagInput);

    let heading = document.createElement("span");
    heading.id = "recording-heading";
    overview.append(heading);

    let importIcon = new Icon("add", e =>  {
        this.update();
        let callback = resp => window.location = "/recording/" + resp.id;
        this.createItem(this.recordingApi, this.data.recording, callback);
        if (tagInput.checked)
            this.setTags(this.data.recording.id);
    });
    let cancelImport = new Icon("clear", e => window.location.href = "/importer");

    let editIcon   = new Icon("create", e => this.toggleEdit(true));
    let saveIcon   = new Icon("save", e => {
        this.update();
        this.saveItem(this.recordingApi, this.data.recording);
        if (tagInput.checked)
            this.setTags(this.data.recording.id);
    });
    let cancelEdit = new Icon("clear", e => {
        this.addInfoFromSource(this.data.recording);
        this.toggleEdit(false);
    });
    let playIcon   = new Icon("play_arrow", e => {
        this.clearCurrentPlaylist();
        this.queueTracks(this.data.recording.tracks)
        this.start();
    });
    let queueIcon  = new Icon("playlist_play", e => this.queueTracks(this.data.recording.tracks));

    let fileAction = function() {
        let filename = rawInfo.data.selected;
        let source = this.data.directory.parsed_text[this.data.directory.text.indexOf(filename)];
        this.addInfoFromSource(source);
    }

    this.addFiles = function(files, baseDir) {
        if (files.length) {
            let info = new RawInfo(files, baseDir, fileAction.bind(this));
            this.root.replaceChild(info.root, rawInfo);
            rawInfo = info;
        } else { rawInfo.innerText = "No notes available"; }
    }

    this.addImages = function(images, baseDir) {
        if (images.length) {
            let image = new RecordingImage(images, baseDir);
            this.root.replaceChild(image.root, imageContainer);
            imageContainer = image;
        } else { imageContainer.innerText = "No images available"; }
    }

    this.updateFiles = (directory) => {
        this.data.directory = directory;
        let artwork = (this.data.recording != null) ? this.data.recording.artwork : null;
        let notes   = (this.data.recording != null) ? this.data.recording.notes   : null;
        directory.images.filter(img => img != artwork).map(img => imageContainer.addImage(img));
        directory.text.filter(file => file != notes).map(file => rawInfo.addFile(file));
    }

    this.update = function() {
        for (let elem of [ recordingTitle, recordingDate, recordingVenue ])
            elem.save();
        tracklist.save();

        this.data.recording.title = recordingTitle.data;
        this.data.recording.recording_date = recordingDate.data;
        this.data.recording.venue = recordingVenue.data;
        this.data.recording.tracks = tracklist.getTracklist();

        let official = document.getElementById("official-checkbox").checked;
        this.data.recording.official = official;

        if (this.data.directory.images.length) {
            let img = document.getElementById("recording-artwork").getAttribute("src")
            this.data.recording.artwork = decodeURIComponent(img.replace(/^\/file\//, ""));
        }
    }

    this.configure = function() {
        if (this.data.context == "import") {
            this.addImages(this.data.directory.images, this.data.directory.relative_path);
            this.addFiles(this.data.directory.text, this.data.directory.relative_path);
            heading.innerText = this.data.directory.relative_path;
            overview.append(importIcon.root);
            overview.append(cancelImport.root);
            document.title    = this.data.directory.relative_path;
        } else {
            let images = (this.data.recording.artwork != null) ? [ this.data.recording.artwork ] : [ ];
            this.addImages(images, this.data.recording.directory);
            let files = (this.data.recording.notes != null) ? [ this.data.recording.notes ] : [ ];
            this.addFiles(files, this.data.recording.directory);

            recordingRating.remove();
            recordingRating = new RatingDisplay(
                this.createRating("recording-rating", this.data.recording.id, this.data.recording.rating),
                [ "recording-rating" ],
                "Rating"
            );
            infoContainer.append(recordingRating.root);
            soundRating.remove();
            soundRating = new RatingDisplay(
                this.createRating("recording-sound-rating", this.data.recording.id, this.data.recording.sound_rating),
                [ "recording-sound-rating" ],
                "Sound Rating"
            );
            infoContainer.append(soundRating.root);

            heading.innerText = this.data.recording.title;;
            document.title    = this.data.recording.title;
        }
    }

    this.addInfoFromSource = function(source) {
        this.data.recording = source;
        recordingTitle.configure(source.title, "title", "Title");
        recordingDate.configure(source.recording_date, "recording-date", "Date");
        recordingVenue.configure(source.venue, "venue", "Venue");
        let taglists = tracklist.setTracklist(source.tracks);
        tracklist.toggleEdit(true);
        for (let field of [ recordingArtist, recordingComposer, recordingGenre ]) {
            taglists.map(taglist => field.linkTaglist(taglist));
            field.toggleEdit(true);
        }
    }

    this.toggleEdit = function(editable) {

        if (editable && this.data.directory == null) {
            let dirname = encodeURIComponent(this.data.recording.directory);
            this.getItem(this.importerApi, dirname, this.updateFiles);
        }

        recordingInfo.map(elem => elem.toggleEdit(editable));
        tracklist.toggleEdit(editable);

        if (editable) {
            infoContainer.append(officialToggle);
            let officialCheckbox = document.getElementById("official-checkbox");
            officialCheckbox.checked = (this.data.recording == null) ? false : this.data.recording.official;
            infoContainer.append(tagToggle);
        } else {
            officialToggle.remove();
            tagToggle.remove();
        }
        
        if (typeof(imageContainer.toggleEdit) !== "undefined")
            imageContainer.toggleEdit(editable);
        if (typeof(rawInfo.toggleEdit) !== "undefined")
            rawInfo.toggleEdit(editable);

        if (this.data.context == "recording") {
            (editable) ? editIcon.remove() : overview.append(editIcon.root);
            (editable) ? playIcon.remove() : overview.append(playIcon.root);
            (editable) ? queueIcon.remove() : overview.append(queueIcon.root);
            (editable) ? recordingRating.remove() : infoContainer.append(recordingRating.root);
            (editable) ? soundRating.remove() : infoContainer.append(soundRating.root);
            (editable) ? overview.append(saveIcon.root): saveIcon.remove();
            (editable) ? overview.append(cancelEdit.root): cancelEdit.remove();
        }
    }
}

function RecordingDisplay(recordingId) {
    Recording.call(this, "recording");
    let initialize = function(recording) {
        this.data.directory = null;
        this.addInfoFromSource(recording);
        this.configure();
        this.toggleEdit(false);
    }
    this.getItem(this.recordingApi, recordingId, initialize.bind(this));
}
RecordingDisplay.prototype = Container;

function ImportDisplay(dirname) {
    Recording.call(this, "import");
    let initialize = (directory) => {
        let source = (directory.text.length) ? directory.parsed_text[0] : directory.parsed_text[directory.parsed_text.length - 1];
        this.data.directory = directory;
        this.addInfoFromSource(source);
        this.configure();
        this.toggleEdit(true);
    }
    this.getItem(this.importerApi, dirname, initialize.bind(this));
}
ImportDisplay.prototype = Container;

export { RecordingDisplay, ImportDisplay };
