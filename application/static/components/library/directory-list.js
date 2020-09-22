import { createListRoot, createListRow } from "../shared/item-list.js";

function createDirectoryList(app) {

    let root = createListRoot("directory-list-root");

    let listHeader = createListRow("list-heading");
    for (let colName of [ "Directory", "Audio", "Images", "Text" ])
        listHeader.addText(colName, "directory-list-" + colName.toLowerCase());
    listHeader.addText("", "directory-list-add");
    root.append(listHeader);

    root.addRow = (entry) => {
        let row = createListRow("directory-list-row");
        row.addText(entry.relative_path, "directory-list-directory");
        row.addText(entry.audio.length, "directory-list-audio");
        row.addText(entry.images.length, "directory-list-images");
        row.addText(entry.text.length, "directory-list-text");
        row.addIcon("add", e => window.location.href = "/importer/" + encodeURIComponent(entry.relative_path), "directory-list-add");
        return row;
    }

    document.title = "Unindexed Directory List";
    app.container = root;
}

export { createDirectoryList };
