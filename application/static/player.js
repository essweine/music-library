import { PlayerContainer } from "/static/components/player-container.js";
import { CurrentTrack } from "/static/components/current-track.js";
import { Player } from "/static/modules/player.js";

customElements.define("player-container", PlayerContainer, { extends: "div" });
customElements.define("current-track", CurrentTrack, { extends: "div" });

window.onload = e => {
    let playerContainer = document.getElementById("player-container");
    playerContainer.initialize();
    playerContainer.update();
}
