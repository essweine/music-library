function createRecordingEvent(eventName, recordingId) { return new CustomEvent(eventName, { detail: recordingId, bubbles: true }); }

function createTrackEvent(eventName, track) { return new CustomEvent(eventName, { detail: track, bubbles: true }); }

function createTracklistEvent(action) { return new CustomEvent("tracklist-action", { detail: action, bubbles: true }); }

function createPlayerEvent(action) { return new CustomEvent("player-control", { detail: action, bubbles: true }); }

function createIcon(iconName, action, className = null) {

    let icon = document.createElement("span");

    icon.innerText = iconName;

    icon.classList.add("material-icons");
    if (className != null)
        icon.classList.add(className);
    icon.onclick = action;

    icon.show = () => icon.style.display = "inline";
    icon.hide = () => icon.style.display = "none";

    return icon;
}

export { createIcon, createRecordingEvent, createTrackEvent, createTracklistEvent, createPlayerEvent };
