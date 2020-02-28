class Arrow extends HTMLSpanElement {

    constructor() {
        super();
    }

    createMoveEvent(direction) {
        let ev = new CustomEvent("move", { detail: direction,  bubbles: true });
        this.dispatchEvent(ev);
    }

    createIcon(iconName, eventName) {
        let icon = document.createElement("i");
        icon.innerText = iconName;
        icon.classList.add("material-icons");
        icon.onclick = e => this.createMoveEvent(eventName);
        return icon;
    }
}

class UpArrow extends Arrow {
    constructor() {
        super();
        this.append(this.createIcon("arrow_upward", "up"));
    }
}

class DownArrow extends Arrow {
    constructor() {
        super();
        this.append(this.createIcon("arrow_downward", "down"));
    }
}

export { UpArrow, DownArrow };
