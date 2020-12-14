import { Container } from "./container.js";

function LogManager() {

    Container.init.call(this, "div", "log-display");

    let records = this.root.getElementsByClassName("log-record");

    this.update = (record) => {
        if (records.length > 150)
            records.item(0).remove();
        this.root.append(this.format(record));
    }

    this.format = (record) => {

        let display = this.createElement("div", null, [ "log-record" ]);

        let meta = this.createElement("span", null, [ "log-" + record.level ]);
        meta.innerText = "[" + record.level[0] + " " + record.timestamp + " " + record.module + "] ";
        display.append(meta);

        let message = this.createElement("span", null, [ "log-message" ]);
        message.innerText = record.message;
        display.append(message);

        let traceback = this.createElement("div", null, [ "log-traceback" ]);
        traceback.innerText = (record.traceback) ? record.traceback : "";
        display.append(traceback);
        
        return display;
    }

    let ws = this.getNotificationService(this.logNotification);
    ws.addEventListener("message", e => this.update(JSON.parse(e.data)));
    document.title = "Player Logs";
}
LogManager.prototype = Container;

export { LogManager };
