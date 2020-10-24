import { createIcon } from "../shared/icons.js";

function createRecordingTag(value, taglist) {

    let tag = document.createElement("span");
    tag.classList.add("tag");
    tag.classList.add("recording-tag");

    let val = document.createElement("span");
    val.classList.add("tag-value");
    val.innerText = value;
    tag.append(val);

    let removeTag = createIcon("clear", e => taglist.removeValue(tag, value), "update-tag");
    tag.append(removeTag);

    return tag;
}

function createTrackTag(property, display, value, taglist) {

    let tag = document.createElement("span");
    tag.classList.add("tag");
    tag.classList.add("recording-track-tag");
    tag.identifier = property + "::" + value;

    let prop = document.createElement("span");
    prop.classList.add("tag-property");
    prop.innerText = display;
    tag.append(prop);

    let val = document.createElement("span");
    val.classList.add("tag-value");
    val.innerText = value;
    tag.append(val);

    let removeTag = createIcon("clear", e => taglist.removeProperty(tag, property, value), "update-tag");
    tag.append(removeTag);

    tag.setEditable = (editable) => (editable) ? tag.append(removeTag) : removeTag.remove();

    return tag;
}

function createRecordingTaglist(property, propertyName, tracklist) {

    let taglist = document.createElement("div");
    taglist.classList.add("recording-taglist");

    taglist.clear = () => {
        for (let tag of Array.from(tagValues.getElementsByClassName("recording-tag")))
            tag.remove();
    }

    taglist.removeValue = (elem, value) => {
        tracklist.removeProperty(property, value);
        elem.remove();
    }

    taglist.initialize = (values) => {
        taglist.clear();
        for (let value of values)
            tagValues.append(createRecordingTag(value, taglist));
        display.innerText = values.join(" / ");
    }

    taglist.toggleEdit = (editable) => {
        if (editable) {
            display.remove();
            taglist.append(label);
            taglist.append(tagValues);
        } else {
            label.remove();
            tagValues.remove();
            taglist.append(display);
        }
    }

    taglist.save = () => { }

    let label = document.createElement("span");
    label.classList.add("taglist-label");
    label.innerText = propertyName;

    let display = document.createElement("span");
    display.classList.add("taglist-display");

    let tagValues = document.createElement("div");
    tagValues.classList.add("taglist-values");

    let newTag = document.createElement("span");

    let newValue = document.createElement("input");
    newValue.type = "text";
    newValue.size = 40;
    newTag.append(newValue);

    let applyTag = () => {
        tracklist.addProperty(property, newValue.value);
        newTag.insertAdjacentElement("afterend", createRecordingTag(newValue.value, taglist));
        newValue.value = "";
    }
    let addIcon = createIcon("add", e => applyTag(), "recording-add-tag");
    newTag.append(addIcon);

    tagValues.append(newTag);

    return taglist;
}


function createTrackTaglist(tags) {

    let taglist = document.createElement("div");
    taglist.classList.add("recording-track-taglist");

    let properties = Object.fromEntries(Object.keys(tags).map(key => [ key, [ ] ]));

    taglist.addProperty = (property, value) => {
        properties[property].push(value);
        taglist.insertBefore(createTrackTag(property, tags[property], value, taglist), newTag);
    }

    taglist.removeProperty = (elem, property, value) => {
        properties[property].splice(properties[property].indexOf(value), 1);
        elem.remove();
    }

    taglist.getProperties = () => { return properties; }

    taglist.findTag = (property, value) => { 
        for (let elem of taglist.getElementsByClassName("recording-track-tag"))
            if (elem.identifier == property + "::" + value)
                return elem;
    }

    taglist.toggleEdit = (editable) => { 
        for (let elem of document.getElementsByClassName("recording-track-tag"))
            elem.setEditable(editable);
        (editable) ? taglist.style["grid-column"] = 3 : taglist.style["grid-column"] = 2;
        (editable) ? taglist.append(newTag) : newTag.remove();
    }

    let tagProperty = document.createElement("select");
    tagProperty.classList.add("tag-property");
    for (let prop of Object.keys(properties)) {
        let option = document.createElement("option");
        option.value = prop;
        option.innerText = tags[prop];
        tagProperty.append(option);
    }

    let tagValue = document.createElement("input");
    tagValue.classList.add("tag-value");
    tagValue.type = "text";
    tagValue.size = 20;

    let cancel = () => {
        tagProperty.remove();
        tagValue.value = "";
        tagValue.remove();
        saveTag.remove();
        cancelEdit.remove();
        newTag.append(editTag);
    }
    let cancelEdit = createIcon("clear", e => cancel(), "edit-tag");

    let save = () => {
        taglist.addProperty(tagProperty.value, tagValue.value);
        cancel();
    }
    let saveTag = createIcon("done", e => save(), "edit-tag");

    let newTag = document.createElement("span");
    newTag.classList.add("tag");
    newTag.classList.add("recording-track-new-tag");

    let editNewTag = () => {
        newTag.insertBefore(tagProperty, editTag);
        newTag.insertBefore(tagValue, editTag);
        editTag.remove();
        newTag.append(saveTag);
        newTag.append(cancelEdit);
    }

    let editTag = createIcon("add", e => editNewTag(), "update-tag");
    newTag.append(editTag);

    taglist.append(newTag);

    return taglist;
}

export { createRecordingTaglist, createTrackTaglist };
