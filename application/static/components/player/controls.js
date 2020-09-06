import { createIcon } from "/static/components/shared/icons.js";

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

function createPlayerControls(app) {

    let controls = createControls("player-controls");

    controls.previous = controls.addIcon("skip_previous", e => app.playerApi.sendTasks([ app.playerApi.skipTask(-1) ]) );
    controls.stop = controls.addIcon("stop", e => app.playerApi.stop());
    controls.pause = controls.addIcon("pause", e => app.playerApi.pause());
    controls.play = controls.addIcon("play_arrow", e => app.playerApi.start());
    controls.next = controls.addIcon("skip_next", e => app.playerApi.sendTasks([ app.playerApi.skipTask(1) ]) );

    return controls;
}

function createTracklistControls(app) {

    let controls = createControls("playlist-controls");

    controls.updateIcons = (shuffle, repeat) => {
        (shuffle) ? controls.shuffle.classList.remove("disabled-icon") : controls.shuffle.classList.add("disabled-icon");
        (repeat) ? controls.repeat.classList.remove("disabled-icon") : controls.repeat.classList.add("disabled-icon");
    }

    controls.shuffle = controls.addIcon("shuffle", e => app.playerApi.shuffle());
    controls.repeat = controls.addIcon("loop", e => app.playerApi.repeat());
    controls.clear = controls.addIcon("clear", e => app.playerApi.clearPlaylist());

    return controls;
}

export { createPlayerControls, createTracklistControls };
