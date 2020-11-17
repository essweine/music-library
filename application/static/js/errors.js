import { Container, ContainerDefinition } from "./application.js";

function ErrorDisplay(messages) {

    let def = new ContainerDefinition("div", [ "error-display" ]);
    Container.call(this, { }, def);
    
    let heading = document.createElement("div");
    heading.classList.add("error-heading");
    heading.innerText = "The following errors occurred";
    this.root.append(heading);

    for (let message of messages) {
        let msg = document.createElement("div");
        msg.classList.add("error-message");
        msg.innerText = message;
        this.root.append(msg);
    }

    document.title = "An error occurred";
}
ErrorDisplay.prototype = new Container;

function LogManager() {

    let def = new ContainerDefinition("div", [ ], "log-display");
    Container.call(this, { }, def);

    let records = this.root.getElementsByClassName("log-record");

    this.update = (record) => {
        if (records.length > 150)
            records.item(0).remove();
        this.root.append(this.format(record));
    }

    this.format = (record) => {

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

    let ws = this.getNotificationService(this.api.logNotification);
    ws.addEventListener("message", e => this.update(JSON.parse(e.data)));

    document.title = "Player Logs";
}
LogManager.prototype = new Container;

export { LogManager, ErrorDisplay };
