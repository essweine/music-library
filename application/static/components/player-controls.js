class PlayerControls extends HTMLDivElement {

    constructor() {
        super();
        this.id = "player-controls";
        this.stop = this.createButton("stop", "stop");
        this.play = this.createButton("play_arrow", "start");

        this.append(this.stop);
        this.append(this.play);
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
