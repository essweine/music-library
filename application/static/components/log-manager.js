function createLogManager(app, ws) {

    let container = document.createElement("div");

    container.id = "log-manager";
    container.view = document.createElement("div");
    container.view.id = "log-display";
    container.append(container.view);
    container.records = container.getElementsByClassName("log-record");

    container.update = (record) => {
        if (container.records.length > 150)
            container.records.item(0).remove();
        container.view.append(container.format(record));
    }

    container.format = (record) => {
        let display = document.createElement("div");
        display.classList.add("log-record");

        let meta = document.createElement("span");
        meta.classList.add("log-" + record.level);
        meta.innerText = "[" + record.level[0] + " " + record.timestamp + " " + record.module + "] ";
        display.append(meta);

        let message = document.createElement("span");
        message.classList.add("log-message");
        message.innerText = record.message;
        display.append(message);

        let traceback = document.createElement("div");
        traceback.classList.add("log-traceback");
        traceback.innerText = (record.traceback) ? record.traceback : "";
        display.append(traceback);
        
        return display;
    }

    document.title = "Player Logs";
    ws.addEventListener("message", e => container.update(JSON.parse(e.data)));
    app.container = container;
}

export { createLogManager };
