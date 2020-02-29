import { Recording } from "/static/modules/api.js";
import { Player } from "/static/modules/player.js";

window.onload = e => {
    let addDirectory  = document.getElementsByClassName("add");
    let addParent     = document.getElementsByClassName("add-parent");
    let viewRecording = document.getElementsByClassName("view-recording");
    let playRecording = document.getElementsByClassName("play-recording");

    for (let elem of addDirectory) {
        let itemId = elem.getAttribute("item");
        elem.onclick = e => window.location.href = "/importer/" + itemId;
    }

    for (let elem of addParent) {
        let itemId = elem.getAttribute("item");
        elem.onclick = e => window.location.href = "/importer/" + itemId + "?parent=true";
    }

    for (let elem of viewRecording) {
        let itemId = elem.getAttribute("item");
        elem.onclick = e => window.location.href = "/recording/" + itemId;
    }

    for (let elem of playRecording) {
        let itemId = elem.getAttribute("item");
        let recordingApi = new Recording(itemId);
        elem.onclick = e => recordingApi.get(Player.playAll.bind(Player));
    }

}
