function createEditableInfo(className) {

    let container = document.createElement("div");
    container.classList.add("editable-info");
    container.classList.add(className);

    container.display = document.createElement("span");
    container.display.classList.add("editable-display");

    container.label = document.createElement("label");
    container.label.classList.add("editable-label");

    container.input      = document.createElement("input");
    container.input.type = "text";
    container.input.size = 40;
    container.input.classList.add("editable-input");

    container.initialize = (text, inputId, inputLabel) => {
        container.label.innerText   = inputLabel;
        container.label.htmlFor     = inputId;
        container.input.id          = inputId;
        container.set(text);
    }

    container.get = () => { return container.display.innerText; }

    container.set = (title) => {
        container.display.innerText = title;
        container.input.value = title;
    }

    container.save = () => { container.display.innerText = container.input.value; }

    container.reset = () => { container.input.value = container.display.innerText; }

    container.toggleEdit = (editable) => {
        if (editable) {
            container.display.remove();
            container.append(container.label);
            container.append(container.input);
        } else {
            container.label.remove();
            container.input.remove();
            container.append(container.display);
        }
    }

    return container;
}

export { createEditableInfo };
