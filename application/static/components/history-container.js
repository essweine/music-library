import { createRatingContainer } from "/static/components/shared/rating-container.js";
import { createTracklistContainer, createTracklistOption, addText } from "/static/components/shared/tracklist-container.js";

function createRecentlyPlayedEntry(track) {

    let entry = document.createElement("div");
    entry.classList.add("recently-played-entry");

    entry.append(addText(track.title, "recent-title"));
    entry.append(addText(track.artist, "recent-artist"));
    entry.append(addText(track.recording, "recent-recording"));

    let ratingContainer = createRatingContainer("recent-rating");
    ratingContainer.configure(track.recording_id, track.filename, track.rating);
    entry.append(ratingContainer);

    let count = (track.count > 1) ? "x " + track.count : "";
    entry.append(addText(count, "recent-count"))

    return entry;
}

function createRecentTracklist() {

    let tracklist = createTracklistContainer("recently-played-entry");
    tracklist.id = "recently-played";
    tracklist.period = 1800;

    let heading = document.createElement("div");
    heading.id = "recent-heading";
    heading.classList.add("history-heading");
    heading.innerText = "Recently Played"
    tracklist.append(heading);

    let options = document.createElement("div");
    options.id = "recent-select";

    let text = document.createElement("span");
    text.classList.add("recent-intro");
    text.innerText = "Show";
    options.append(text);

    let createEvent = (period) => { return new CustomEvent("update-recently-played", { detail: period, bubbles: true }) };

    let span30 = createTracklistOption("30 minutes", "recent-period", "recent-period-selected", createEvent(1800));
    span30.classList.add("recent-period-selected");
    options.append(span30);

    options.append(createTracklistOption("1 hour", "recent-period", "recent-period-selected", createEvent(3600)));
    options.append(createTracklistOption("2 hours", "recent-period", "recent-period-selected", createEvent(7200)));
    options.append(createTracklistOption("1 day", "recent-period", "recent-period-selected", createEvent(86400)));

    tracklist.update = (tracks) => {
        let entries = tracks.map(track => createRecentlyPlayedEntry(track));
        tracklist._update(entries);
        tracklist.append(options);
    }

    return tracklist;
}

function createHistoryContainer(app, ws) {

    let container = document.createElement("div");
    container.id = "history-container";

    container.recent = createRecentTracklist();
    container.append(container.recent);

    document.title = "Player History";
    app.container = container;

    ws.addEventListener("message", e => 
        app.historyApi.getRecentTracks(app.container.recent.period, app.container.recent.update));

    app.content.addEventListener("update-recently-played", e => {
        app.historyApi.getRecentTracks(e.detail, app.container.recent.update);
        app.container.recent.period = e.detail;
    });
}

export { createHistoryContainer };
