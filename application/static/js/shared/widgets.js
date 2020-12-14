import { Container } from "../container.js";

function Icon(iconName, action, classes = [ ], id = null) {

    Container.init.call(this, "div", id, classes.concat([ "material-icons" ]));

    this.root.innerText = iconName;
    this.root.onclick = action;

    this.show   = () => this.root.style.display = "inline";
    this.hide   = () => this.root.style.display = "none";
    this.remove = () => this.root.remove();

    this.addClass    = (className) => this.root.classList.add(className);
    this.removeClass = (className) => this.root.classList.remove(className);
}
Icon.prototype = Container;

function RatingDisplay(rating, classes = [ ], labelText = null, id = null) {

    Container.init.call(this, "span", id, classes.concat([ "rating-container" ]));
    this.data = rating;

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
        this.updateRating(this.data);
    }

    this.remove = () => { this.root.remove() }

    if (labelText != null) {
        let label = this.createElement("span", null, [ "rating-label" ]);
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
RatingDisplay.prototype = Container;

function EditableInfo(classes = [ ]) {

    Container.init.call(this, "div", null, classes.concat([ "editable-info" ]));

    let display = this.createElement("span", null, [ "editable-display" ]);
    let label   = this.createElement("label", null, [ "editable-label" ]);
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
EditableInfo.prototype = Container;

function Options(classes = [ ], id = null) {

    Container.init.call(this, "div", id, classes);

    let className     = "options-action";
    let selectedClass = "options-action-selected";

    let select = (option) => {
        Array.from(this.root.getElementsByClassName(selectedClass)).map(e => e.classList.remove(selectedClass));
        option.classList.add(selectedClass);
        this.data = option;
    }

    this.addOption = (text, action, selected = false) => {
        let option = this.createElement("span", null, [ className ]);
        option.innerText = text;
        if (this.data == null || selected)
            select(option);
        option.onclick = (e) => {
            select(e.target);
            action();
        }
        this.root.append(option);
    }

    this.addText = (text) => {
        let span = this.createElement("span", null, [ "options-text" ]);
        span.innerText = text;
        this.root.append(span);
    }
}
Options.prototype = Container;

export { Icon, RatingDisplay, EditableInfo, Options };
