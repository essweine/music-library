function createErrorDisplay(messages) {
    let container = document.createElement("div");
    container.classList.add("error-display");
    
    let heading = document.createElement("div");
    heading.classList.add("error-heading");
    heading.innerText = "The following errors occurred";
    container.append(heading);

    for (let message of messages) {
        let msg = document.createElement("div");
        msg.classList.add("error-message");
        msg.innerText = message;
        container.append(msg);
    }
    document.title = "An error occurred";
    return container;
}

export { createErrorDisplay };
