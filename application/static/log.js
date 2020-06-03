import { LogManager, createLogManager } from "/static/components/log-manager.js";

customElements.define("log-manager", LogManager, { extends: "div" });

window.onload = e => { createLogManager(); }
