class RecordingRawInfo extends HTMLDivElement {
    constructor() {
        super();
        this.id = "recording-raw-info";

        this.toggle           = document.createElement("button");
        this.toggle.onclick   = e => this.toggleNotes();

        this.select = document.createElement("select");
        this.select.oninput = e => this.selectFile(e);

        this.notes               = document.createElement("pre");
        this.notes.id            = "raw-text";
        this.append(this.notes);

        this.notesVisible;
    }

    toggleEdit(editable) {
        if (editable) {
            this.toggle.remove();
            this.insertBefore(this.select, this.notes);
            this.notes.style.display = "block";
            this.notesVisible = true;
            this.style.padding = "10px";
            this.style["background-color"] = "#eee";
        } else {
            this.select.remove();
            this.insertBefore(this.toggle, this.notes);
            this.toggle.innerText = "Show Notes";
            this.notes.style.display = "none";
            this.notesVisible = false;
            this.style.padding = "0";
            this.style["background-color"] = "#fff";
        }
    }

    addFile(file, directory) {
        let option = document.createElement("option");
        option.value = file;
        option.innerText = file.replace(directory + "/", "");
        this.select.append(option);
    }

    selectFile(e) {
        this.getNotes(e.target.value);
        let ev = new CustomEvent("select-file", { detail: e.target.value, bubbles: true });
        this.dispatchEvent(ev);
    }

    getNotes(file) {
        let request = new XMLHttpRequest();
        request.onload = e => this.notes.innerText = e.target.response;
        request.open("GET", "/file/" + file);
        request.send();
    }

    toggleNotes() {
        this.notesVisible        = !this.notesVisible;
        this.toggle.innerText    = (this.notesVisible) ? "Hide notes" : "Show notes";
        this.notes.style.display = (this.notesVisible) ? "block" : "none";
        this.style.padding       = (this.notesVisible) ? "10px": "";
        this.style["background-color"] = (this.notesVisible) ? "#eee" : "#fff";
    }
}

function createRecordingRawInfo(files, directory, selected = null) {
    let rawInfo = document.createElement("div", { is: "recording-raw-info" });
    for (let file of files)
        rawInfo.addFile(file, directory);
    (selected != null) ? rawInfo.getNotes(selected) : rawInfo.getNotes(files[0]);
    return rawInfo;
}

export { RecordingRawInfo, createRecordingRawInfo };
