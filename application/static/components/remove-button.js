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
        this.append(this.icon);
    }
}

export { RemoveButton };
