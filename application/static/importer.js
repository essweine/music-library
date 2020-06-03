import { Importer } from "/static/modules/api.js";
import { ListRow, createListRow } from "/static/components/list-row.js";

customElements.define("list-row", ListRow, { extends: "div" });

window.onload = e => {

    let container = document.getElementById("content");
    let directoryList = document.createElement("div");
    directoryList.classList.add("list-root");
    container.append(directoryList);

    let listHeader = createListRow("list-heading");
    directoryList.append(listHeader);
    for (let colName of [ "Directory", "Audio", "Images", "Text" ])
        listHeader.addText(colName, "directory-list-" + colName.toLowerCase());

    function importDirectory(name) { return e => window.location.href = "/importer/" + name; }

    function addEntry(response) {
        for (let entry of response) {
            let row = createListRow("directory-list-row");
            row.addText(entry.relative_path, "directory-list-directory");
            row.addText(entry.audio.length, "directory-list-audio");
            row.addText(entry.images.length, "directory-list-images");
            row.addText(entry.text.length, "diretory-list-text");
            row.addIcon("add", importDirectory(entry.relative_path), "directory-list-add");
            directoryList.append(row);
        }
    }

    let importerApi = new Importer();
    importerApi.listAll(addEntry);
}
