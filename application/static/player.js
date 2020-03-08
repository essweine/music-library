import { PlayerContainer } from "/static/components/player-container.js";
import { CurrentTrack } from "/static/components/current-track.js";
import { Player } from "/static/modules/player.js";
import { NextTracksContainer, RecentlyPlayedContainer } from  "/static/components/player-tracklist.js";

customElements.define("player-container", PlayerContainer, { extends: "div" });
customElements.define("current-track", CurrentTrack, { extends: "div" });
customElements.define("next-tracks", NextTracksContainer, { extends: "div" });
customElements.define("recently-played", RecentlyPlayedContainer, { extends: "div" });

window.onload = e => {
    let playerContainer = document.getElementById("player-container");
    playerContainer.initialize();

    let wsUrl = "ws://" + location.host + Player.wsUrl;
    let ws = new WebSocket(wsUrl);
    ws.addEventListener("open", e => ws.send("open"));
    ws.addEventListener("message", e => playerContainer.update());
}
