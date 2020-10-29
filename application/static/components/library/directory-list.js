import { createListRoot, createListRow } from "../shared/item-list.js";

function createDirectoryList(app) {

    let columns = [
        { display: "Directory", className: "directory-list-directory", type: "text" },
        { display: "Audio", className: "directory-list-audio", type: "text" },
        { display: "Images", className: "directory-list-images", type: "text" },
        { display: "Text", className: "directory-list-text", type: "text" },
        { display: "", className: "directory-list-add", type: "icon" },
    ];

    let root = createListRoot(columns, "directory-list-root", "directory-list-row");

    root.getData = (entry) => {
        return {
            values: [
                entry.relative_path,
                entry.audio.length,
                entry.images.length,
                entry.text.length,
                { name: "add", action: e => window.location.href = "/importer/" + encodeURIComponent(entry.relative_path) },
            ],
            action: null,
        };
    }

    root.addHeading();

    document.title = "Unindexed Directory List";
    app.container = root;
}

export { createDirectoryList };
