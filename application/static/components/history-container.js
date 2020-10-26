import { createRatingContainer } from "/static/components/shared/rating-container.js";
import { createTracklistContainer, createTracklistOption, addText } from "/static/components/shared/tracklist-container.js";

function createRecentlyPlayedEntry(track) {

    let entry = document.createElement("div");
    entry.classList.add("recently-played-entry");

    entry.append(addText(track.title, "recent-title"));
    entry.append(addText(track.artist, "recent-artist"));
    entry.append(addText(track.recording, "recent-recording"));

    let ratingContainer = createRatingContainer("recent-rating");
    ratingContainer.configure("track", track.filename, track.rating);
    entry.append(ratingContainer);

    let count = (track.count > 1) ? "x " + track.count : "";
    entry.append(addText(count, "recent-count"))

    return entry;
}

function createHistoryContainer(app, ws) {

    let container = document.createElement("div");
    container.id = "history-container";

    container.tracklist = createTracklistContainer("recently-played-entry");
    container.tracklist.id = "recently-played";
    container.tracklist.period = 1800;

    let heading = document.createElement("div");
    heading.id = "recent-heading";
    heading.classList.add("history-heading");
    heading.innerText = "Recently Played"
    container.tracklist.append(heading);

    let options = document.createElement("div");
    options.id = "recent-select";

    let text = document.createElement("span");
    text.classList.add("recent-intro");
    text.innerText = "Show";
    options.append(text);

    container.tracklist.update = (tracks) => {
        let entries = tracks.map(track => createRecentlyPlayedEntry(track));
        container.tracklist._update(entries);
        container.tracklist.append(options);
    }

    let updateHistory = (period) => function() { 
        app.historyApi.getRecentTracks(period, container.tracklist.update);
        container.tracklist.period = period
    }

    let span30 = createTracklistOption("30 minutes", "recent-period", "recent-period-selected", updateHistory(1800));
    span30.classList.add("recent-period-selected");
    options.append(span30);

    options.append(createTracklistOption("1 hour", "recent-period", "recent-period-selected", updateHistory(3600)));
    options.append(createTracklistOption("2 hours", "recent-period", "recent-period-selected", updateHistory(7200)));
    options.append(createTracklistOption("1 day", "recent-period", "recent-period-selected", updateHistory(86400)));

    ws.addEventListener("message", e => 
        app.historyApi.getRecentTracks(container.tracklist.period, container.tracklist.update));

    container.append(container.tracklist);
    document.title = "Player History";
    app.container = container;
}

export { createHistoryContainer };
