function updateEntry(entry, position, end = false) {
    for (let i = 0; i < entry.children.length; i++) {
        let child = entry.children.item(i);
        if (child.classList.contains("tracklist-position"))
            child.textContent = position + 1;
        else if (child.classList.contains("move-up") && position == 0)
            child.style.display = "none";
        else if (child.classList.contains("move-up"))
            child.style.display = "inline";
        else if (child.classList.contains("move-down") && end)
            child.style.display = "none";
        else if (child.classList.contains("move-down"))
            child.style.display = "inline";
    }
}

function moveTrack(entry, direction) {
    return function(e) {

        let tracklist = document.getElementById("tracklist-container");
        let position = null;
        for (let i = 0; i < tracklist.children.length; i++)
            if (tracklist.children.item(i) == entry)
                position = i;

        if (direction == "up") {

            let item = tracklist.children.item(position);
            let prev = tracklist.children.item(position - 1);
            tracklist.removeChild(item);
            tracklist.insertBefore(item, prev);
            updateEntry(item, position - 1);
            updateEntry(prev, position, position == tracklist.children.length - 1);

        } else if (direction == "down") {

            let item = tracklist.children.item(position + 1);
            let prev = tracklist.children.item(position);
            tracklist.removeChild(item);
            tracklist.insertBefore(item, prev);
            updateEntry(item, position);
            updateEntry(prev, position + 1, position + 1 == tracklist.children.length - 1);
        }
    }
}

let moveUp = document.getElementsByClassName("move-up");
for (let item of moveUp)
    item.onclick = moveTrack(item.parentNode, "up");
moveUp.item(0).style.display = "none";

let moveDown = document.getElementsByClassName("move-down");
for (let item of moveDown)
    item.onclick = moveTrack(item.parentNode, "down");
moveDown.item(moveDown.length - 1).style.display = "none";

function getRecordingData() {

    let imageSelect = document.getElementById("select-image");
    let textSelect = document.getElementById("select-text");
    let data = { 
        directory: root,
        title: document.getElementById("title").value,
        artist: document.getElementById("artist").value,
        recording_date: document.getElementById("recording-date").value,
        venue: document.getElementById("venue").value,
        artwork: imageSelect != null ? imageSelect.value : null,
        notes: textSelect != null ? textSelect.value : null,
        tracklist: [ ]
    };

    let tracklist = Array.from(document.getElementsByClassName("tracklist-entry")).map(entry => {
        let track = { };
        for (let i = 0; i < entry.children.length; i++) {
            let child = entry.children.item(i);
            if (child.classList.contains("tracklist-position"))
                track.track_num = child.textContent;
            else if (child.classList.contains("tracklist-label"))
                track.filename = child.getAttribute("for");
            else if (child.classList.contains("tracklist-input"))
                track.title = child.value;
        }
        data.tracklist.push(track);
    });

    return data;
}

function addToLibrary(e) {
    let data = getRecordingData();
    let id = document.getElementById("add-to-library").getAttribute("name");
    let request = new XMLHttpRequest();
    request.addEventListener("load", e => window.location = "/recording/" + id);
    request.open("PUT", "/recording/" + id);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(data));
}

document.getElementById("add-to-library").onclick = e => addToLibrary(e);
