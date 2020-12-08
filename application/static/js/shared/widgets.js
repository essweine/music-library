import { Container, ContainerDefinition } from "../application.js";

function Icon(iconName, action, classes = [ ], id = null) {
    let def = new ContainerDefinition("div", classes.concat([ "material-icons" ]), id);
    Container.call(this, { }, def);

    this.root.innerText = iconName;
    this.root.onclick = action;

    this.show   = () => this.root.style.display = "inline";
    this.hide   = () => this.root.style.display = "none";
    this.remove = () => this.root.remove();

    this.addClass    = (className) => this.root.classList.add(className);
    this.removeClass = (className) => this.root.classList.remove(className);
}

function RatingDisplay(rating, classes = [ ], labelText = null, id = null) {

    let def = new ContainerDefinition("span", classes.concat([ "rating-container" ]), id);
    Container.call(this, rating, def);

    this.setRating = (rating) => {
        this.data = rating;
        this.setValue(rating.value);
    }

    this.setValue = (value) => {
        this.data.value = value;
        let stars = this.root.getElementsByClassName("star-icon");
        for (let i = 0; i < 5; i++) {
            if (value == null) {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.remove("unfilled");
            } else if (i < value) {
                stars.item(i).classList.add("filled");
                stars.item(i).classList.remove("unfilled");
            } else {
                stars.item(i).classList.remove("filled");
                stars.item(i).classList.add("unfilled");
            }
        }
    }

    this.updateValue = (value) => {
        this.setValue(value);
        this.api.updateRating(this.data);
    }

    this.remove = () => { this.root.remove() }

    if (labelText != null) {
        let label = document.createElement("span");
        label.classList.add("rating-label");
        label.innerText = labelText;
        this.root.append(label);
    }

    let addIcon = (name, action, className) => {
        let icon = new Icon(name, action, [ className ]);
        this.root.append(icon.root);
    }
    for (let i = 0; i < 5; i++)
        addIcon("grade", e => this.updateValue(i + 1), "star-icon");
    addIcon("clear", e => this.updateValue(null), "clear-icon");

    if (rating != null)
        this.setRating(rating);
}
RatingDisplay.prototype = new Container;

function EditableInfo(classes = [ ]) {

    let def = new ContainerDefinition("div", classes.concat([ "editable-info" ]));
    Container.call(this, { }, def);

    let display = document.createElement("span");
    display.classList.add("editable-display");

    let label = document.createElement("label");
    label.classList.add("editable-label");

    let input      = document.createElement("input");
    input.type = "text";
    input.size = 40;
    input.classList.add("editable-input");

    this.configure = (text, inputId, inputLabel) => {
        label.innerText = inputLabel;
        label.htmlFor   = inputId;
        input.id        = inputId;
        this.set(text);
    }

    this.set = (text) => {
        this.data = text;
        display.innerText = text;
        input.value = text;
    }

    this.save = () => { this.data = input.value; }

    this.reset = () => { input.value = this.data; }

    this.currentValue = () => { return input.value; }

    this.toggleEdit = (editable) => {
        if (editable) {
            display.remove();
            this.root.append(label);
            this.root.append(input);
        } else {
            label.remove();
            input.remove();
            this.root.append(display);
        }
    }
}
EditableInfo.prototype = new Container;

function Options(classes = [ ], id = null) {

    let def = new ContainerDefinition("div", classes, id);
    Container.call(this, null, def);

    let className     = "options-action";
    let selectedClass = "options-action-selected";

    let select = (option) => {
        Array.from(this.root.getElementsByClassName(selectedClass)).map(e => e.classList.remove(selectedClass));
        option.classList.add(selectedClass);
        this.data = option;
    }

    this.addOption = (text, action, selected = false) => {
        let option = document.createElement("span");
        option.innerText = text;
        option.classList.add(className);
        if (this.data == null || selected)
            select(option);
        option.onclick = (e) => {
            select(e.target);
            action();
        }
        this.root.append(option);
    }

    this.addText = (text) => {
        let span = document.createElement("span");
        span.classList.add("options-text");
        span.innerText = text;
        this.root.append(span);
    }
}
Options.prototype = new Container;

export { Icon, RatingDisplay, EditableInfo, Options };
