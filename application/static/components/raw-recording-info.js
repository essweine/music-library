class RawRecordingInfo extends HTMLDivElement {
    constructor() {
        super();
        this.id = "raw-recording-info";
        this.filesAvailable;
    }

    initialize(directory) {

        let files = [ ];
        for (let attr of this.getAttributeNames())
            if (attr.startsWith("file"))
                files.push(this.getAttribute(attr));

        if (files.length) {
            while (this.firstChild)
                this.firstChild.remove();
            this.filesAvailable = true;
        }

        this.select = document.createElement("select");
        for (let file of files) {
            let option = document.createElement("option");
            option.value = file;
            option.innerText = file.replace(directory + "/", "");
            this.select.append(option);
        }
        this.select.oninput = e => {
            this.getNotes(e.target.value);
            let ev = new CustomEvent("select-file", { detail: e.target.value, bubbles: true });
            this.dispatchEvent(ev);
        }

        this.notes               = document.createElement("pre");
        this.notes.id            = "raw-text";
        this.notes.style.display = "none";
        this.append(this.notes);

        this.notesVisible = false;

        this.toggle         = document.createElement("button");
        this.toggle.onclick = e => {
            if (this.notesVisible)
                this.hideNotes();
            else
                this.showNotes();
        }
    }

    update(context) {
        if (this.filesAvailable) {
            this.getNotes(this.select.options[0].value);
            if (context == "display")
                this.updateForDisplay();
            else
                this.updateForEdit();
        }
    }

    updateForDisplay() {
        this.select.remove();
        this.insertBefore(this.toggle, this.notes);
        this.hideNotes();
    }

    updateForEdit() {
        this.toggle.remove();
        this.insertBefore(this.select, this.notes);
        this.showNotes();
    }

    showNotes() {
        this.toggle.innerText    = "Hide notes";
        this.notes.style.display = "block"
        this.notesVisible        = true;
    }

    hideNotes() {
        this.toggle.innerText    = "Show notes";
        this.notes.style.display = "none"
        this.notesVisible        = false;
    }

    getNotes(file) {
        let request = new XMLHttpRequest();
        request.onload = e => { document.getElementById("raw-text").innerText = e.target.response; }
        request.open("GET", "/file/" + file);
        request.send();
    }
}


export { RawRecordingInfo };
