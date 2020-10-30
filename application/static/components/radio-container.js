import { createListRoot, createListRow } from "./shared/item-list.js";
import { createSearchBar } from "./shared/item-list-search.js";
import { createIcon } from "./shared/icons.js";
import { createEditableInfo } from "./shared/editable-info.js";

function createStationEditor(app) {

    let editor = document.createElement("div");
    editor.classList.add("station-edit");

    let heading = document.createElement("div");
    heading.classList.add("station-edit-heading");

    let headingText = document.createElement("span");
    headingText.classList.add("station-edit-text");
    heading.append(headingText);

    editor.append(heading);

    let name    = createEditableInfo("station-edit-name");
    let website = createEditableInfo("station-edit-website");
    let url     = createEditableInfo("station-edit-url");

    editor.append(name);
    editor.append(website);
    editor.append(url);

    editor.save = () => { name.save(); website.save(); url.save(); }

    editor.reset = () => { name.reset(); website.reset(); url.reset(); }

    editor.update = (context) => {
        editor.save();
        let data = { id: editor.id, name: name.get(), website: website.get(), url: url.get() };
        if (context == "add")
            app.stationApi.addStation(data, editor.refreshStations);
        else if (context == "save")
            app.stationApi.saveStation(data, editor.refreshStations);
        editor.setContent(null);
    }

    let addIcon   = createIcon("add", e => editor.update("add"), "station-edit-add");
    let saveIcon  = createIcon("save", e => editor.update("save"), "station-edit-save");
    let undoIcon  = createIcon("undo", e => editor.reset(), "station-edit-undo");
    let clearIcon = createIcon("clear", e => editor.setContent(null), "station-edit-cancel");

    let icons = document.createElement("span");
    icons.classList.add("station-edit-icons");
    heading.append(icons);

    for (let icon of [ addIcon, saveIcon, undoIcon, clearIcon ])
        icons.append(icon);

    editor.setContent = (station) => {
        if (station == null) {
            editor.id = "new";
            headingText.innerText = "New Station";
            name.initialize("", "name", "Name");
            website.initialize("", "website", "Website");
            url.initialize("", "url", "Stream URL");
            addIcon.show();
            saveIcon.hide();
            undoIcon.hide();
        } else {
            editor.id = station.id;
            headingText.innerText = "Editing " + station.name;
            name.set(station.name);
            website.set(station.website);
            url.set(station.url);
            addIcon.hide();
            saveIcon.show();
            undoIcon.show();
        }
        name.toggleEdit(true);
        website.toggleEdit(true);
        url.toggleEdit(true);
    }

    return editor;
}

function createStationList(app, stationEditor) {

    let columns = [
        { display: "Name", className: "station-list-name", type: "text" },
        { display: "Website", className: "station-list-website", type: "link" },
        { display: "Minutes Listened", className: "station-list-minutes-listened", type: "text" },
        { display: "Last Listened", className: "station-list-last-listened", type: "text" },
        { display: "Rating", className: "station-list-rating", type: "rating" },
        { display: "", className: "station-list-edit", type: "icon" },
        { display: "", className: "station-list-play", type: "icon" },
        { display: "", className: "station-list-delete", type: "icon" },
    ];

    let root = createListRoot(columns, "stream-list-root");
    root.id = "radio-container";

    let query = { match: [ ], exclude: [ ] }
    
    let search = createSearchBar(root, query);
    root.configureSearch = (config) => search.initialize(config);
    root.append(search);

    root.updateResults = (query) => app.stationApi.search(query, root.update);

    root.refresh = () => app.stationApi.search(query, root.update);

    root.save = (station) => app.stationApi.saveStation(station);

    root.deleteStation = (stationId) => app.stationApi.deleteStation(stationId, root.refresh);

    root.getData = (station) => {
        return {
            values: [
                station.name,
                { text: station.website, url: station.website },
                station.minutes_listened,
                station.last_listened,
                { itemType: "station", itemId: station.id, rating: station.rating },
                { name: "create", action: e => stationEditor.setContent(station) },
                { name: "play_arrow", action: e => app.playerApi.streamUrl(station.url) },
                { name: "clear", action: e => root.deleteStation(station.id) },
            ],
            action: null
        };
    }

    root.addHeading();
    return root;
}

function createRadioContainer(app) {

    let container = document.createElement("div");
    let stationEditor = createStationEditor(app);
    container.stationList = createStationList(app, stationEditor);
    stationEditor.setContent(null);
    stationEditor.refreshStations = container.stationList.refresh;
    container.append(stationEditor);
    container.append(container.stationList);
    app.container = container;
    document.title = "Internet Radio"
}

export { createRadioContainer };
