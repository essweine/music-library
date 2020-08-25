import { createIcon } from "/static/components/shared/icons.js";

function createSelect(text, values) {
    let select = document.createElement("select");
    for (let idx in text) {
        let option = document.createElement("option");
        option.innerText = text[idx];
        option.value = values[idx];
        select.append(option);
    }
    return select;
}

function updateQuery(container, exclude) {

    let selected  = container.select.value;
    let value     = ([ "rating", "sound_rating" ].includes(selected)) ? container.ratingValue.value : container.textInput.value;
    let queryType = (exclude) ? container.query.exclude : container.query.match;

    let criterion = { };
    criterion[selected] = value;

    let excluded = document.createElement("span");
    excluded.classList.add("material-icons");
    excluded.classList.add("list-search-hidden");
    excluded.innerText = (exclude) ? "highlight_off" : "check_circle_outline";
    container.append(excluded);

    let critName = document.createElement("span");
    critName.classList.add("list-search-name");
    critName.innerText = container.critNames[container.critValues.indexOf(selected)]
    container.append(critName);

    let critValue = document.createElement("span");
    critValue.classList.add("list-search-value");
    critValue.innerText = value;
    container.append(critValue);

    let action = e => {
        queryType = queryType.splice(queryType.indexOf(criterion), 1);
        excluded.remove();
        critName.remove();
        critValue.remove();
        e.target.remove();
        container.dispatchEvent(new CustomEvent("update-recordings", { detail: container.query, bubbles: true }));
    }

    let removeIcon = createIcon("clear", action, "list-search-remove");
    container.append(removeIcon);

    queryType.push(criterion);
    container.dispatchEvent(new CustomEvent("update-recordings", { detail: container.query, bubbles: true }));
}

function createSearchBar() {

    let container = document.createElement("div");
    container.query = { 
        match: [ ],
        exclude: [ ],
    };
    container.classList.add("list-search-bar");

    let label = document.createElement("span");
    label.classList.add("list-search-label");
    label.innerText = "Search";
    container.append(label);

    container.critNames = [ "Artist", "Contains Track", "Minimum Rating", "Minimum Sound Rating", "Date" ];
    container.critValues = [ "artist", "track_title", "rating", "sound_rating", "recording_date" ]

    container.select = createSelect(container.critNames, container.critValues);
    container.select.classList.add("list-search-select");
    container.append(container.select);
    
    container.select.oninput = e => {
        if ([ "artist", "recording_title", "track_title" ].includes(e.target.value)) {
            container.ratingValue.remove();
            container.insertBefore(container.textInput, showIcon);
        } else if ([ "rating", "sound_rating" ].includes(e.target.value)) {
            container.textInput.remove();
            container.insertBefore(container.ratingValue, showIcon);
        } else if (e.target.value == "recording_date") {
            container.ratingValue.remove();
            container.insertBefore(container.textInput, showIcon);
            let date = new Date(Date.now());
            container.textInput.value = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        }
    }

    container.textInput = document.createElement("input");
    container.textInput.classList.add("list-text-search");
    container.textInput.type = "text";
    container.textInput.name = "search-criteria";
    container.append(container.textInput);

    container.ratingValue = createSelect([ "1", "2", "3", "4", "5", "Unrated" ], [ "1", "2", "3", "4", "5", null ]);

    let showIcon = createIcon("check_circle_outline", e => updateQuery(container, false), "list-search-show");
    container.append(showIcon);

    let hideIcon = createIcon("highlight_off", e => updateQuery(container, true), "list-search-hide");
    container.append(hideIcon);

    return container;
}

export { createSearchBar };
