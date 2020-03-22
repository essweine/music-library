class PlayerControl extends HTMLDivElement {

    constructor() {
        super();
        icon.classList.add("player-control");
    }

    createIcon(iconName, action) {

        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.onclick = e => this.dispatchEvent(new CustomEvent("player-control", { detail: action, bubbles: true }));

        container.append(icon);
        return container;
    }
}

class PlayerStop extends PlayerControl {
    constructor() {
        super();
        this.icon = this.createIcon("stop", "stop");
    }
}

class PlayerStart extends PlayerControl {
    constructor() {
        super();
        this.icon = this.createIcon("play", "start");
    }
}

export { PlayerControls };
