function createRadioContainer(app) {

    let container = document.createElement("div");
    container.id = "radio-container";

    let stream = document.createElement("input");
    stream.type = "text";
    stream.size = 80;
    stream.value = "enter URL to stream";
    container.append(stream);

    let button = document.createElement("input");
    button.type = "button";
    button.value = "Play";
    container.append(button);

    button.onclick = (e) => {
        app.playerApi.streamUrl(stream.value);
    };

    document.title = "Stream URL"
    app.container = container;
}

export { createRadioContainer };
