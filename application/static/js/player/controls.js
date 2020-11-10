import { createIcon } from "../shared/icons.js";
import { Task } from "../api.js";

function createControls(id) {

    let controls = document.createElement("div");
    controls.id = id;

    controls.addIcon = (name, action) => {
        let icon = createIcon(name, action, "control-icon");
        controls.append(icon);
        return icon;
    }

    return controls;
}

function createPlayerControls(api) {

    let controls = createControls("player-controls");

    controls.previous = controls.addIcon("skip_previous", e => api.sendTasks([ new Task("skip", { offset: -1 }) ]) );
    controls.stop = controls.addIcon("stop", e => api.stop());
    controls.pause = controls.addIcon("pause", e => api.pause());
    controls.play = controls.addIcon("play_arrow", e => api.start());
    controls.next = controls.addIcon("skip_next", e => api.sendTasks([ new Task("skip", { offset: 1 }) ]) );

    return controls;
}

function createTracklistControls(api) {

    let controls = createControls("playlist-controls");

    controls.updateIcons = (shuffle, repeat) => {
        (shuffle) ? controls.shuffle.classList.remove("disabled-icon") : controls.shuffle.classList.add("disabled-icon");
        (repeat) ? controls.repeat.classList.remove("disabled-icon") : controls.repeat.classList.add("disabled-icon");
    }

    controls.shuffle = controls.addIcon("shuffle", e => api.shuffleCurrentPlaylist());
    controls.repeat = controls.addIcon("loop", e => api.repeatCurrentPlaylist());
    controls.clear = controls.addIcon("clear", e => api.clearCurrentPlaylist());

    return controls;
}

export { createPlayerControls, createTracklistControls };
