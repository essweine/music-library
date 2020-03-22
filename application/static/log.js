import { LogManager } from "/static/components/log-manager.js";

customElements.define("log-manager", LogManager, { extends: "div" });

window.onload = e => {
    let logView = document.getElementById("log-manager");
    let wsUrl = "ws://" + location.host + "/api/log/notifications";
    let ws = new WebSocket(wsUrl);
    ws.addEventListener("open", e => ws.send(""));
    ws.addEventListener("message", e => logView.update(JSON.parse(e.data)));
}
