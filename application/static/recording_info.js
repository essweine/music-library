let recordingInfo = null;

function updateRecordingInfo(e) {
    recordingInfo = JSON.parse(e.target.response);
    document.getElementById("title").value = recordingInfo.title;
    document.getElementById("artist").value = recordingInfo.artist;
    document.getElementById("recording-date").value = recordingInfo.recording_date;
    document.getElementById("venue").value = recordingInfo.venue;
    document.getElementById("raw-text").textContent = recordingInfo.contents.join("");
    setTracklistNames(recordingInfo.tracks);
};

function getDataFromFile(filename) {
    let request = new XMLHttpRequest();
    let data = new FormData();
    data.append("directory", root);
    data.append("filename", filename);
    request.addEventListener("load", e => updateRecordingInfo(e));
    request.open("POST", "/importer");
    request.send(data);
}

function setTracklistNames(names) {
    let tracklistItems = document.getElementsByClassName("tracklist-input");
    for (let i = 0; i < tracklistItems.length; i++)
        tracklistItems.item(i).value = names[i];
}

const shiftTrackNames = document.getElementById("shift-names");
shiftTrackNames.onclick = e => {
    let tracks = Array.from(document.getElementsByClassName("tracklist-input")).map(item => item.value);
    let names = tracks.slice(1, tracks.length).concat("");
    setTracklistNames(names);
};

const reapplyTrackNames = document.getElementById("reapply-names");
reapplyTrackNames.onclick = e => setTracklistNames(recordingInfo.tracks);

const selectText = document.getElementById("select-text");
selectText.oninput = e => { getDataFromFile(e.target.value); };
getDataFromFile(selectText.options[0].value);

