class EditableInfo extends HTMLDivElement {
    constructor() {
        super();
        this.classList.add("editable-info");

        this.display = document.createElement("span");
        this.display.classList.add("editable-display");

        this.label = document.createElement("label");
        this.label.classList.add("editable-label");

        this.input      = document.createElement("input");
        this.input.type = "text";
        this.input.size = 40;
        this.input.classList.add("editable-input");
    }

    initialize(text, inputId, inputLabel) {
        this.label.innerText   = inputLabel;
        this.label.htmlFor     = inputId;
        this.input.id          = inputId;
        this.set(text);
    }

    get() { return this.display.innerText; }

    set(title) {
        this.display.innerText = title;
        this.input.value = title;
    }

    save() { this.display.innerText = this.input.value; }

    reset() { this.input.value = this.display.innerText; }

    toggleEdit(editable) {
        if (editable) {
            this.display.remove();
            this.append(this.label);
            this.append(this.input);
        } else {
            this.label.remove();
            this.input.remove();
            this.append(this.display);
        }
    }
}

function createEditableInfo(className) {
    let elem = document.createElement("div", { is: "editable-info" });
    elem.classList.add(className);
    return elem;
}

export { EditableInfo, createEditableInfo };
