import { Container, ContainerDefinition } from "../application.js";
import { ListRoot } from "../shared/list.js";

function DirectoryList() {

    let columns = [
        { display: "Directory", className: "directory-list-directory", type: "text" },
        { display: "Audio", className: "directory-list-audio", type: "text" },
        { display: "Images", className: "directory-list-images", type: "text" },
        { display: "Text", className: "directory-list-text", type: "text" },
        { display: "", className: "directory-list-add", type: "icon" },
    ];
    ListRoot.call(this, columns, [ "directory-list-root" ]);

    this.getData = (entry) => {
        return {
            values: [
                entry.relative_path,
                entry.audio.length,
                entry.images.length,
                entry.text.length,
                { name: "add", action: e => window.location.href = "/importer/" + encodeURIComponent(entry.relative_path) },
            ],
            action: null,
        };
    }

    this.addHeading();

    document.title = "Unindexed Directory List";
    this.api.getAllDirectories(this.addRows.bind(this));
}
DirectoryList.prototype = new Container;

function RecordingImage(images, directory, selected = null) {

    let def = new ContainerDefinition("div", [ ], "recording-image");
    let data = { directory: directory };
    Container.call(this, data, def);

    let img = document.createElement("img");
    img.id = "recording-artwork";
    this.root.append(img);

    let select = document.createElement("select");
    select.oninput = e => {
        img.src = "/file/" + encodeURIComponent(e.target.value);
        this.data.selected = e.target.value
    }

    this.addImage = function(image) {
        let option = document.createElement("option");
        option.value = image;
        option.innerText = image.replace(this.data.directory + "/", "");
        select.append(option);
    }

    this.toggleEdit = function(editable) { (editable) ? this.root.append(select) : select.remove(); }

    let selectImage = (image) => {
        img.src = "/file/" + encodeURIComponent(image);
        for (let option of select.options)
            if (option.value == image)
                option.selected = true;
    }

    for (let image of images)
        this.addImage(image, directory);
    (selected != null) ? selectImage(selected) : selectImage(images[0]);
}
RecordingImage.prototype = new Container;

function RawInfo(files, directory, selectAction, selected = null) {

    let def = new ContainerDefinition("div", [ ], "recording-raw-info");
    let data = {
        directory: directory,
        notesVisible: false,
    };
    Container.call(this, data, def);

    let notes = document.createElement("pre");
    notes.id  = "raw-text";
    this.root.append(notes);

    let toggle = document.createElement("button");
    toggle.onclick = e => {
        this.data.notesVisible = !this.data.notesVisible;
        toggle.innerText    = (this.data.notesVisible) ? "Hide notes" : "Show notes";
        notes.style.display = (this.data.notesVisible) ? "block" : "none";
        this.root.style.padding = (this.data.notesVisible) ? "10px": "";
        this.root.style["background-color"] = (this.data.notesVisible) ? "#eee" : "#fff";
    }

    let getNotes = function(file) {
        let request = new XMLHttpRequest();
        request.onload = e => notes.innerText = e.target.response;
        request.open("GET", "/file/" + encodeURIComponent(file));
        request.send();
    }

    let select = document.createElement("select");
    select.oninput = e => {
        this.data.selected = e.target.value;
        let filename = e.target.value;
        getNotes(filename);
        selectAction();
    }

    this.toggleEdit = function(editable) {
        if (editable) {
            toggle.remove();
            this.root.insertBefore(select, notes);
            notes.style.display = "block";
            this.data.notesVisible = true;
            this.root.style.padding = "10px";
            this.root.style["background-color"] = "#eee";
        } else {
            select.remove();
            this.root.insertBefore(toggle, notes);
            toggle.innerText = "Show Notes";
            notes.style.display = "none";
            this.data.notesVisible = false;
            this.root.style.padding = "0";
            this.root.style["background-color"] = "#fff";
        }
    }

    this.addFile = function(file) {
        let option = document.createElement("option");
        option.value = file;
        option.innerText = file.replace(this.data.directory + "/", "");
        select.append(option);
    }

    for (let file of files)
        this.addFile(file);
    (selected != null) ? getNotes(selected) : getNotes(files[0]);
}
RawInfo.prototype = new Container;

export { DirectoryList, RecordingImage, RawInfo };
