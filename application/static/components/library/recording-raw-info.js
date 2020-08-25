function createRecordingRawInfo(files, directory, selected = null) {

    let container = document.createElement("div", { is: "recording-raw-info" });
    container.id = "recording-raw-info";

    container.toggle           = document.createElement("button");
    container.toggle.onclick   = e => container.toggleNotes();

    container.select = document.createElement("select");
    container.select.oninput = e => container.selectFile(e);

    container.notes               = document.createElement("pre");
    container.notes.id            = "raw-text";
    container.append(container.notes);

    container.toggleEdit = (editable) => {
        if (editable) {
            container.toggle.remove();
            container.insertBefore(container.select, container.notes);
            container.notes.style.display = "block";
            container.notesVisible = true;
            container.style.padding = "10px";
            container.style["background-color"] = "#eee";
        } else {
            container.select.remove();
            container.insertBefore(container.toggle, container.notes);
            container.toggle.innerText = "Show Notes";
            container.notes.style.display = "none";
            container.notesVisible = false;
            container.style.padding = "0";
            container.style["background-color"] = "#fff";
        }
    }

    container.addFile = (file, directory) => {
        let option = document.createElement("option");
        option.value = file;
        option.innerText = file.replace(directory + "/", "");
        container.select.append(option);
    }

    container.selectFile = (e) => {
        container.getNotes(e.target.value);
        let ev = new CustomEvent("select-file", { detail: e.target.value, bubbles: true });
        container.dispatchEvent(ev);
    }

    container.getNotes = (file) => {
        let request = new XMLHttpRequest();
        request.onload = e => container.notes.innerText = e.target.response;
        request.open("GET", "/file/" + file);
        request.send();
    }

    container.toggleNotes = () => {
        container.notesVisible        = !container.notesVisible;
        container.toggle.innerText    = (container.notesVisible) ? "Hide notes" : "Show notes";
        container.notes.style.display = (container.notesVisible) ? "block" : "none";
        container.style.padding       = (container.notesVisible) ? "10px": "";
        container.style["background-color"] = (container.notesVisible) ? "#eee" : "#fff";
    }

    for (let file of files)
        container.addFile(file, directory);
    (selected != null) ? container.getNotes(selected) : container.getNotes(files[0]);

    return container;
}

export { createRecordingRawInfo };
