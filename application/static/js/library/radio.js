import { Container } from "../container.js";
import { ListRoot } from "../shared/list.js";
import { SearchBar } from "../shared/search.js";
import { Icon, EditableInfo } from "../shared/widgets.js";

function StationEditor() {

    Container.init.call(this, "div", "station-editor");

    let heading = this.createElement("div", "station-edit-heading", [ "section-heading" ]);
    let headingText = this.createElement("span", "station-edit-text");
    heading.append(headingText);
    this.root.append(heading);

    let name    = new EditableInfo([ "station-edit-data" ]);
    let website = new EditableInfo([ "station-edit-data" ]);
    let url     = new EditableInfo([ "station-edit-data" ]);

    this.root.append(name.root);
    this.root.append(website.root);
    this.root.append(url.root);

    this.save = function() { name.save(); website.save(); url.save(); }

    this.reset = function() { name.reset(); website.reset(); url.reset(); }

    this.update = function(context) {
        this.save();
        let data = {
            id: this.data,
            name: name.data,
            website: website.data,
            url: url.data
        };
        if (context == "add")
            this.createItem(this.stationApi, data, this.refreshStations);
        else if (context == "save")
            this.saveItem(this.stationApi, data, this.refreshStations);
        this.setContent(null);
    }

    let addIcon   = new Icon("add", e => this.update("add"), [ "station-edit-action" ]);
    let saveIcon  = new Icon("save", e => this.update("save"), [ "station-edit-action" ]);
    let undoIcon  = new Icon("undo", e => this.reset(), [ "station-edit-action" ]);
    let clearIcon = new Icon("clear", e => this.setContent(null), [ "station-edit-action" ]);

    let icons = this.createElement("span", "station-edit-icons");
    heading.append(icons);

    for (let icon of [ addIcon, saveIcon, undoIcon, clearIcon ])
        icons.append(icon.root);

    this.setContent = (station) => {
        if (station == null) {
            this.data = null;
            headingText.innerText = "New Station";
            name.configure("", "name", "Name");
            website.configure("", "website", "Website");
            url.configure("", "url", "Stream URL");
            addIcon.show();
            saveIcon.hide();
            undoIcon.hide();
        } else {
            this.data = station.id;
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
}
StationEditor.prototype = Container;

function StationList(stationEditor) {

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

    let getStationData = (station) => {
        return {
            values: [
                station.name,
                { text: station.website, url: station.website },
                station.minutes_listened,
                station.last_listened,
                Container.createRating("station", station.id, station.rating),
                { name: "create", action: e => stationEditor.setContent(station) },
                { name: "play_arrow", action: e => this.streamUrl(station.url) },
                { name: "clear", action: e => this.deleteStation(station.id) },
            ],
            expand: null,
        };
    }

    ListRoot.call(this, columns, getStationData, "stream-list-root");

    this.refresh = function(query) { this.query(this.stationApi, query, this.update.bind(this)); }

    this.deleteStation = function(stationId) { this.deleteItem(this.stationApi, stationId, this.refresh.bind(this, this.search.data)); }

    this.search = new SearchBar("station-list-search", this.stationApi, this.refresh.bind(this));
    this.root.append(this.search.root);
    this.addHeading();
}
StationList.prototype = new ListRoot;

function RadioContainer() {

    Container.init.call(this, "div", "radio-container");

    let stationEditor = new StationEditor();
    let stationList = new StationList(stationEditor);
    stationEditor.setContent(null);
    // This makes no fucking sense.
    stationEditor.refreshStations = () => stationList.refresh.call(stationList, stationList.search.data);
    this.root.append(stationEditor.root);
    this.root.append(stationList.root);

    document.title = "Internet Radio";
}
RadioContainer.prototype = Container;

export { RadioContainer };
