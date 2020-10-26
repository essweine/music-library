import { createRatingContainer } from "/static/components/shared/rating-container.js";

function createCurrentTrack() {

    let container = document.createElement("div");
    container.id = "current-track";

    container.bullshitArtworkContainer = document.createElement("div");
    container.bullshitArtworkContainer.classList.add("bullshit-container-1");
    container.append(container.bullshitArtworkContainer);

    container.bullshitTextContainer = document.createElement("div");
    container.bullshitTextContainer.classList.add("bullshit-container-2");
    container.append(container.bullshitTextContainer);

    container.img = document.createElement("img");
    container.img.id = "artwork";
    // Ideally I would not have to set container, but none of the css-based solutions I've tried have
    // worked.  Who would have thought making a resizable square container would be so fucking difficult?
    container.img.width = 250;
    container.img.height = 250;
    container.bullshitArtworkContainer.append(container.img);

    container.trackTitle = document.createElement("div");
    container.trackTitle.id = "track-title";
    container.bullshitTextContainer.append(container.trackTitle);

    container.recordingTitle = document.createElement("div");
    container.recordingTitle.id = "recording-title";
    container.recordingLink = document.createElement("a");
    container.recordingLink.id = "recording-link";
    container.recordingTitle.append(container.recordingLink);
    container.bullshitTextContainer.append(container.recordingTitle);

    container.artist = document.createElement("div");
    container.artist.id = "track-artist";
    container.bullshitTextContainer.append(container.artist);

    container.ratingContainer = createRatingContainer();
    container.ratingContainer.id = "track-rating";

    container.bullshitTextContainer.append(container.ratingContainer);

    container.update = (track) => {

        container.trackTitle.innerText = track.title;
        container.recordingLink.href = "/recording/" + track.recording_id;
        container.recordingLink.innerText = track.recording;
        container.artist.innerText = track.artist;
        if (track.artwork != null)
            container.img.src = "/file/" + encodeURIComponent(track.artwork);
        else
            container.img.remove();
        container.ratingContainer.configure("track", track.filename, track.rating);
    }

    return container;
}

function createCurrentStream() {

    let container = document.createElement("div");
    container.id = "current-stream";

    container.url = document.createElement("div");
    container.url.id = "station-data";
    container.append(container.url);

    container.stationLink = document.createElement("a");

    let titleContainer = document.createElement("div");
    titleContainer.id = "stream-title-container";

    container.streamTitle = document.createElement("div");
    container.streamTitle.id = "stream-title";
    titleContainer.append(container.streamTitle);

    container.append(titleContainer);

    container.update = (stream) => {
        if (stream.station.website) {
            container.url.innerText = "Streaming ";
            container.stationLink.href = stream.station.website;
            container.stationLink.innerText = stream.station.name;
            container.url.append(container.stationLink);
        } else {
            container.stationLink.remove();
            container.url.innerText = "Streaming " + stream.station.name;
        }

        if (stream.metadata != null) 
            container.streamTitle.innerText = stream.metadata.StreamTitle;
        else
            container.streamTitle.innerText = "No metadata available";
    }

    return container;
}

export { createCurrentTrack, createCurrentStream };
