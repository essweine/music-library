import { createNextTracksContainer } from "/static/components/player-tracklist.js";
import { createRatingContainer } from "/static/components/rating-container.js";
import { createIcon, createPlayerEvent } from "/static/components/icons.js";

function addPlayerControls() {

    let controls = document.createElement("div");
    controls.id = "player-controls";

    controls.addIcon = (name, action) => {
        let icon = createIcon(name, e => controls.dispatchEvent(createPlayerEvent(action)), "control-icon");
        controls.append(icon);
        return icon;
    }

    controls.previous = controls.addIcon("skip_previous", "back");
    controls.stop = controls.addIcon("stop", "stop");
    controls.pause = controls.addIcon("pause", "pause");
    controls.play = controls.addIcon("play_arrow", "start");
    controls.next = controls.addIcon("skip_next", "next");

    return controls;
}

function addCurrentTrack() {

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
    // Ideally I would not have to set container, but none of the css-based solutions I've tried
    // have worked.  When I get around to making container truly responsive (if I ever do given what a 
    // fucking gigantic pile of shit css is) I suppose I'll revisit it.  Who would have thought 
    // making a resizable square container would be so fucking difficult?
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
            container.img.src = "/file/" + track.artwork;
        else
            container.img.remove();
        container.ratingContainer.configure(track.recording_id, track.filename, track.rating);
    }

    document.title = "Now Playing";
    return container;
}

function createPlayerContainer() {

    let container = document.createElement("div");
    container.id = "player-container";
    container.current = null;

    container.currentTrack = addCurrentTrack();
    container.playerControls = addPlayerControls();
    container.nextTracks = createNextTracksContainer();

    for (let elem of [ container.currentTrack, container.playerControls, container.nextTracks ])
        container.append(elem);

    container.update = (state) => {
        container.elapsed = state.elapsed;
        container.current = state.current;
        let current = state.current;
        if (current != null) {
            container.currentTrack.update(current);
            container.insertBefore(container.currentTrack, container.playerControls);
        } else {
            container.currentTrack.remove();
        }
        container.nextTracks.update(state.next_entries);
    }

    return container;
}

export { createPlayerContainer };
