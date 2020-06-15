function createIcon(iconName, action, className = null) {
    let icon = document.createElement("span");
    icon.innerText = iconName;
    icon.classList.add("material-icons");
    if (className != null)
        icon.classList.add(className);
    icon.onclick = action;
    return icon;
}

function addIcon(iconName, action, className = null) {
    let icon = createIcon(iconName, action, className);
    this.append(icon);
}

export { createIcon, addIcon };

