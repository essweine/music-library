class LogManager extends HTMLDivElement {
    constructor() {
        super();
        this.id = "log-manager";
        this.view = document.createElement("div");
        this.view.id = "log-display";
        this.append(this.view);
        this.records = this.getElementsByClassName("log-record");

        let wsUrl = "ws://" + location.host + "/api/log/notifications";
        let ws = new WebSocket(wsUrl);
        ws.addEventListener("open", e => ws.send(""));
        ws.addEventListener("message", e => this.update(JSON.parse(e.data)));
    }

    update(record) {
        if (this.records.length > 150)
            this.records.item(0).remove();
        this.view.append(this.format(record));
    }

    format(record) {
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
}

export { LogManager };
