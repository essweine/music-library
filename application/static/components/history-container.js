import { createRatingContainer } from "/static/components/rating-container.js";
import { createTracklistContainer, createTracklistOption } from "/static/components/tracklist-container.js";

function createRecentlyPlayedEntry(track) {

    let entry = document.createElement("div");
    entry.classList.add("recently-played-entry");

    let title = document.createElement("span");
    title.classList.add("recent-title");
    title.innerText = track.title;
    entry.append(title);

    let artist = document.createElement("span");
    artist.classList.add("recent-artist");
    artist.innerText = track.artist;
    entry.append(artist);

    let recording = document.createElement("span");
    recording.classList.add("recent-recording");
    recording.innerText = track.recording;
    entry.append(recording);

    let ratingContainer = createRatingContainer("recent-rating");
    ratingContainer.configure(track.recording_id, track.filename, track.rating);
    entry.append(ratingContainer);

    let count = document.createElement("span");
    count.classList.add("recent-count");
    count.innerText = (track.count > 1) ? "x " + track.count : "";
    entry.append(count)

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

function createHistoryContainer() {
    let container = document.createElement("div");
    container.id = "history-container";

    container.recent = createRecentTracklist();
    container.append(container.recent);

    document.title = "Player History";
    return container;
}

export { createHistoryContainer };
