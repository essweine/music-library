import { createRatingContainer } from "/static/components/rating-container.js";
import { createTracklistContainer } from "/static/components/tracklist-container.js";

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

function createPeriodSelector(text, period, cb) {
    let span = document.createElement("span");
    span.innerText = text;
    span.classList.add("recent-period");
    span.onclick = () => cb(period, span);
    return span;
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

    tracklist.updatePeriod = (period, span) => {
        tracklist.period = period;
        Array.from(document.getElementsByClassName("recent-period-selected")).map(e => e.classList.remove("recent-period-selected"));
        span.classList.add("recent-period-selected");
        let ev = new CustomEvent("update-recently-played", { detail: period, bubbles: true });
        tracklist.dispatchEvent(ev);
    }

    let period = document.createElement("div");
    period.id = "recent-select";

    let text = document.createElement("span");
    text.classList.add("recent-intro");
    text.innerText = "Show";
    period.append(text);

    let span30 = createPeriodSelector("30 minutes", 1800, tracklist.updatePeriod);
    span30.classList.add("recent-period-selected");
    period.append(span30);

    period.append(createPeriodSelector("1 hour", 3600, tracklist.updatePeriod));
    period.append(createPeriodSelector("2 hours", 7200, tracklist.updatePeriod));
    period.append(createPeriodSelector("1 day", 86400, tracklist.updatePeriod));

    tracklist.update = (tracks) => {
        let entries = tracks.map(track => createRecentlyPlayedEntry(track));
        tracklist._update(entries);
        tracklist.append(period);
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
