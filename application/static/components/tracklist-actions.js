class Arrow extends HTMLSpanElement {

    constructor() {
        super();
    }

    show() { this.style.display = "inline"; }
    hide() { this.style.display = "none"; }

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
        this.classList.add("move-up");
    }
}

class DownArrow extends Arrow {
    constructor() {
        super();
        this.append(this.createIcon("arrow_downward", "down"));
        this.classList.add("move-down");
    }
}

class RemoveButton extends HTMLSpanElement {

    constructor() {
        super();
        this.icon = document.createElement("i");
        this.icon.innerText = "clear";
        this.icon.classList.add("material-icons");
        this.icon.onclick = e => {
            let ev = new CustomEvent("remove", { bubbles: true });
            this.dispatchEvent(ev);
        };
        this.classList.add("remove");
        this.append(this.icon);
    }
}

export { UpArrow, DownArrow, RemoveButton };
