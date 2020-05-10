class PlayerControls extends HTMLDivElement {

    constructor() {
        super();
        this.id = "player-controls";
        this.stop = this.createButton("stop", "stop");
        this.pause = this.createButton("pause", "pause");
        this.play = this.createButton("play_arrow", "start");
        this.previous = this.createButton("skip_previous", "back");
        this.next = this.createButton("skip_next", "next");

        this.append(this.previous);
        this.append(this.stop);
        this.append(this.pause);
        this.append(this.play);
        this.append(this.next);
    }

    createButton(iconName, action) {

        let container = document.createElement("div");
        container.classList.add("control-container");

        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.classList.add("control-icon");
        icon.onclick = e => this.dispatchEvent(new CustomEvent("player-control", { detail: action, bubbles: true }));

        container.append(icon);
        return container;
    }
}

export { PlayerControls };
