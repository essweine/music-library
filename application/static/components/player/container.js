import { createPlaylist } from "./playlist.js";
import { createCurrentTrack, createCurrentStream } from "./current-item.js";
import { createPlayerControls } from "./controls.js";
import { createRatingContainer } from "/static/components/shared/rating-container.js";

function createPlayerContainer(app, ws) {

    let container = document.createElement("div");
    container.id = "player-container";
    container.current = null;

    container.currentTrack = createCurrentTrack();
    container.currentStream = createCurrentStream();
    container.playerControls = createPlayerControls(app);
    container.playlist = createPlaylist(app);

    for (let elem of [ container.currentTrack, container.playerControls, container.playlist ])
        container.append(elem);

    container.update = (state) => {
        container.current = state.current;
        if (state.stream != null) {
            container.currentStream.update(state.stream);
            container.currentTrack.remove();
            container.playlist.remove();
            container.insertBefore(container.currentStream, container.playerControls);
        } else if (state.playlist.length > 0) {
            let current = state.playlist[state.current];
            container.currentTrack.update(current);
            container.currentStream.remove();
            container.insertBefore(container.currentTrack, container.playerControls);
            container.append(container.playlist);
        } else {
            container.currentTrack.remove();
            container.currentStream.remove();
            container.append(container.playlist);
        }
        container.playlist.update(state.playlist, state.current, state.shuffle, state.repeat);
    }

    app.content.addEventListener("update-playlist", e => {
        if (e.detail.action == "move-track-up") {
            app.playerApi.sendTasks([ app.playerApi.moveTask(e.detail.position, e.detail.position - 1) ]);
        } else if (e.detail.action == "move-track-down") {
            app.playerApi.sendTasks([ app.playerApi.moveTask(e.detail.position, e.detail.position + 1) ]);
        } else if (e.detail.action == "remove-track") {
            app.playerApi.sendTasks([ app.playerApi.removeTask(e.detail.position) ]);
        }
    });

    ws.addEventListener("message", e => app.playerApi.getCurrentState(app.container.update));

    document.title = "Now Playing";
    app.container = container;
}

export { createPlayerContainer };
