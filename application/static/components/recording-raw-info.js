class RecordingRawInfo extends HTMLDivElement {
    constructor() {
        super();
        this.id = "recording-raw-info";
        this.files = [ ];
    }

    initialize(directory) {

        for (let attr of this.getAttributeNames())
            if (attr.startsWith("file"))
                this.files.push(this.getAttribute(attr));

        if (this.files.length) {

            while (this.firstChild)
                this.firstChild.remove();

            this.select = document.createElement("select");
            for (let file of this.files) {
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
            this.toggle              = document.createElement("button");
            this.toggle.onclick      = e => this.toggleNotes();

            this.append(this.toggle);
            this.append(this.notes);

            this.getNotes(this.files[0]);
        }
    }

    update(context) {
        if (context == "display") {
            this.select.remove();
            this.insertBefore(this.toggle, this.notes);
            this.notesVisible = false;
            this.toggleNotes();
        } else {
            this.toggle.remove();
            this.insertBefore(this.select, this.notes);
            this.notesVisible = true;
            this.toggleNotes();
        }
    }

    getNotes(file) {
        let request = new XMLHttpRequest();
        request.onload = e => { document.getElementById("raw-text").innerText = e.target.response; }
        request.open("GET", "/file/" + file);
        request.send();
    }

    toggleNotes() {
        this.toggle.innerText    = (this.notesVisible) ? "Hide notes" : "Show notes";
        this.notes.style.display = (this.notesVisible) ? "block" : "none";
        this.notesVisible        = !this.notesVisible;
    }

    addNotes(directory, newFiles) {
        for (let file of newFiles) {
            if (!this.files.includes(file)) {
                this.files.push(file);
                let option = document.createElement("option");
                option.value = file;
                option.innerText = file.replace(directory + "/", "");
                this.select.append(option);
            }
        }
    }
}

export { RecordingRawInfo };
