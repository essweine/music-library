import { Container } from "../container.js";
import { Icon, EditableInfo } from "../shared/widgets.js";

function StreamEditor(streamType) {

    Container.init.call(this, "div", "stream-editor");

    let api = (streamType == "station") ? this.stationApi : this.podcastApi;

    let heading = this.createElement("div", "stream-edit-heading", [ "section-heading" ]);
    let headingText = this.createElement("span", "stream-edit-text");
    heading.append(headingText);
    this.root.append(heading);

    let name    = new EditableInfo([ "stream-edit-data" ]);
    let website = new EditableInfo([ "stream-edit-data" ]);
    let url     = new EditableInfo([ "stream-edit-data" ]);

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
        };
        (streamType == "station") ? data.url = url.data : data.rss = url.data;
        if (context == "add")
            this.createItem(api, data, this.refreshStreams);
        else if (context == "save")
            this.saveItem(api, data, this.refreshStreams);
        this.setContent(null);
    }

    let addIcon   = new Icon("add", e => this.update("add"), [ "stream-edit-action" ]);
    let saveIcon  = new Icon("save", e => this.update("save"), [ "stream-edit-action" ]);
    let undoIcon  = new Icon("undo", e => this.reset(), [ "stream-edit-action" ]);
    let clearIcon = new Icon("clear", e => this.setContent(null), [ "stream-edit-action" ]);

    let icons = this.createElement("span", "stream-edit-icons");
    heading.append(icons);

    for (let icon of [ addIcon, saveIcon, undoIcon, clearIcon ])
        icons.append(icon.root);

    this.setContent = (stream) => {
        if (stream == null) {
            this.data = null;
            headingText.innerText = (streamType == "station") ? "New Station" : "New Podcast";
            name.configure("", "name", "Name");
            website.configure("", "website", "Website");
            (streamType == "station") ? url.configure("", "url", "Stream URL") : url.configure("", "url", "RSS");
            addIcon.show();
            saveIcon.hide();
            undoIcon.hide();
        } else {
            this.data = stream.id;
            headingText.innerText = "Editing " + stream.name;
            name.set(stream.name);
            website.set(stream.website);
            (streamType == "station") ? url.set(stream.url) : url.set(stream.rss);
            addIcon.hide();
            saveIcon.show();
            undoIcon.show();
        }
        name.toggleEdit(true);
        website.toggleEdit(true);
        url.toggleEdit(true);
    }
}
StreamEditor.prototype = Container;

export { StreamEditor };
