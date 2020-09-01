import { createPlayerTracklist } from "./player-tracklist.js";
import { createRatingContainer } from "/static/components/shared/rating-container.js";
import { createIcon, createPlayerEvent } from "/static/components/shared/icons.js";

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

    let space = document.createElement("span");
    space.style.width = "30px";
    controls.append(space);

    controls.clear = controls.addIcon("clear", "clear");

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
            container.img.src = "/file/" + encodeURIComponent(track.artwork);
        else
            container.img.remove();
        container.ratingContainer.configure(track.recording_id, track.filename, track.rating);
    }

    return container;
}

function addCurrentStream() {

    let container = document.createElement("div");
    container.id = "current-stream";

    container.url = document.createElement("div");
    container.url.id = "stream-url";
    container.append(container.url);

    let titleContainer = document.createElement("div");
    titleContainer.id = "stream-title-container";

    container.streamTitle = document.createElement("div");
    container.streamTitle.id = "stream-title";
    titleContainer.append(container.streamTitle);

    container.append(titleContainer);

    container.update = (stream) => {
        container.url.innerText = "Streaming " + stream.url;
        if (stream.metadata != null) {
            container.streamTitle.innerText = stream.metadata.StreamTitle;
        }
    }

    return container;
}

function addPlayerEvents(app) {

    app.content.addEventListener("player-control", e => {
        if (e.detail == "stop") {
            app.playerApi.stop();
        } else if (e.detail == "pause") {
            app.playerApi.pause();
        } else if (e.detail == "start") {
            app.playerApi.start();
        } else if (e.detail == "back") {
            let task = app.playerApi.createTask("goto", null, app.container.current - 1);
            app.playerApi.sendTasks([ task ]);
        } else if (e.detail == "next") {
            let task = app.playerApi.createTask("goto", null, app.container.current + 1);
            app.playerApi.sendTasks([ task ]);
        } else if (e.detail == "clear") {
            app.playerApi.clearPlaylist();
        }
    });

    app.content.addEventListener("update-playlist", e => {
        if (e.detail.action == "move-track-up") {
            app.playerApi.sendTasks([
                app.playerApi.createTask("remove", null, e.detail.position),
                app.playerApi.createTask("add", e.detail.filename, e.detail.position - 1)
            ]);
        } else if (e.detail.action == "move-track-down") {
            app.playerApi.sendTasks([
                app.playerApi.createTask("remove", null, e.detail.position),
                app.playerApi.createTask("add", e.detail.filename, e.detail.position + 1)
            ]);
        } else if (e.detail.action == "remove-track") {
            app.playerApi.sendTasks([ app.playerApi.createTask("remove", null, e.detail.position) ]);
        }
    });
}

function createPlayerContainer(app, ws) {

    let container = document.createElement("div");
    container.id = "player-container";
    container.current = null;

    container.currentTrack = addCurrentTrack();
    container.currentStream = addCurrentStream();
    container.playerControls = addPlayerControls();
    container.playlistContainer = createPlayerTracklist();

    for (let elem of [ container.currentTrack, container.playerControls, container.playlistContainer ])
        container.append(elem);

    container.update = (state) => {
        container.current = state.current;
        if (state.stream != null) {
            container.currentStream.update(state.stream);
            container.currentTrack.remove();
            container.playlistContainer.remove();
            container.insertBefore(container.currentStream, container.playerControls);
        } else if (state.playlist.length > 0) {
            let current = state.playlist[state.current];
            container.currentTrack.update(current);
            container.currentStream.remove();
            container.insertBefore(container.currentTrack, container.playerControls);
            container.append(container.playlistContainer);
        } else {
            container.currentTrack.remove();
            container.currentStream.remove();
            container.append(container.playlistContainer);
        }
        container.playlistContainer.update(state.playlist, state.current);
    }

    document.title = "Now Playing";
    app.container = container;
    ws.addEventListener("message", e => app.playerApi.getCurrentState(app.container.update));
    addPlayerEvents(app);
}

export { createPlayerContainer };
