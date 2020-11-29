function createIcon(iconName, action, className = null) {

    let icon = document.createElement("span");

    icon.innerText = iconName;

    icon.classList.add("material-icons");
    if (className != null)
        icon.classList.add(className);
    icon.onclick = action;

    icon.show = () => icon.style.display = "inline";
    icon.hide = () => icon.style.display = "none";

    return icon;
}

export { createIcon };