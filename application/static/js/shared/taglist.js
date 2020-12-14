import { Container } from "../container.js";
import { Icon } from "../shared/widgets.js";

function Tag(data, removeAction) {

    Container.init.call(this, "span", null, [ "tag" ]);
    this.data = { 
        prop: data.prop,
        value: data.value
    };

    let prop = this.createElement("span", null, [ "tag-property" ]);
    prop.innerText = data.display;
    this.root.append(prop);

    let val = this.createElement("span", null, [ "tag-value" ]);
    val.innerText = data.value;
    this.root.append(val);

    let removeTag = new Icon("clear", e => removeAction(this), [ "tag-action" ]);

    this.hideProperty = () => { prop.remove(); }
    this.toggleEdit = (editable) => { (editable) ? this.root.append(removeTag.root) : removeTag.remove(); }
}
Tag.prototype = Container

function NewTag(propNames, saveAction) {

    Container.init.call(this, "span", null, [ "tag" ]);

    let tagProperty = this.createElement("select", null, [ "tag-property" ]);
    for (let prop of Object.keys(propNames)) {
        let option = document.createElement("option");
        option.value = prop;
        option.innerText = propNames[prop];
        tagProperty.append(option);
    }

    let tagValue = this.createElement("input", null, [ "tag-value" ]);
    tagValue.type = "text";
    tagValue.size = 20;

    let cancel = () => {
        tagProperty.remove();
        tagValue.value = "";
        tagValue.remove();
        saveTag.root.remove();
        cancelEdit.root.remove();
        this.root.append(editTag.root);
    }

    let editNewTag = () => {
        this.root.insertBefore(tagProperty, editTag.root);
        this.root.insertBefore(tagValue, editTag.root);
        editTag.root.remove();
        this.root.append(saveTag.root);
        this.root.append(cancelEdit.root);
    }

    let save = function() {
        saveAction(tagProperty.value, tagValue.value);
        cancel();
    }

    let editTag = new Icon("add", e => editNewTag(), [ "tag-action" ]);
    let cancelEdit = new Icon("clear", e => cancel(), [ "edit-tag-action" ]);
    let saveTag = new Icon("done", e => save(), [ "edit-tag-action" ]);

    this.root.append(editTag.root);
}
NewTag.prototype = Container;

function Taglist(propNames = { }, classes = [ ]) {

    Container.init.call(this, "div", null, classes.concat([ "taglist" ]));
    this.data = Object.fromEntries(Object.keys(propNames).map(key => [ key, [ ] ]));

    this.getValues = function(prop) { return this.data[prop].map(tag => tag.data.value); }

    this.addTag = function(prop, value) {
        if (!this.data[prop].map(tag => tag.data.value).includes(value)) {
            let tagData = { prop: prop, value: value, display: propNames[prop] };
            let tag = new Tag(tagData, this.removeTag.bind(this));
            tag.toggleEdit(true);
            this.root.insertBefore(tag.root, newTag.root);
            this.data[prop].push(tag);
        }
    }

    this.removeTag = function(tag) {
        this.data[tag.data.prop].splice(this.data[tag.data.prop].indexOf(tag), 1);
        tag.root.remove();
    }

    this.toggleEdit = function(editable) {
        for (let prop in this.data)
            this.data[prop].map(tag => tag.toggleEdit(editable));
        (editable) ? this.root.append(newTag.root) : newTag.root.remove();
        (editable) ? this.root.classList.add("editable-taglist") : this.root.classList.remove("editable-taglist");
    }

    this.getTag = function(prop, value) {
        for (let tag of this.data[prop])
            if (tag.data.value == value)
                return tag;
    }

    let newTag = new NewTag(propNames, this.addTag.bind(this));
    this.root.append(newTag.root);
}
Taglist.prototype = Container;

function AggregateTaglist(prop, propName, classes = [ ]) {

    Container.init.call(this, "div", null, classes.concat("aggregate-taglist"));
    this.data = [ ];

    this.linkTaglist = function(taglist) { this.data.push(taglist); }

    let label = this.createElement("span", null, [ "taglist-label" ]);
    label.innerText = propName;

    let display = this.createElement("span", null, [ "taglist-display" ]);

    let tagValues = this.createElement("div", null, [ "taglist-values" ]);

    let newTag = document.createElement("span");
    let newValue = document.createElement("input");
    newValue.type = "text";
    newValue.size = 40;
    newTag.append(newValue);

    let addIcon = new Icon("add", e => this.addTag(), [ "aggregate-add-tag" ]);
    newTag.append(addIcon.root);
    tagValues.append(newTag);

    this.removeTag = function(tag) {
        for (let taglist of this.data) {
            let linkedTag = taglist.getTag(prop, tag.data.value);
            if (typeof(linkedTag) !== "undefined")
                taglist.removeTag(linkedTag);
        }
        tag.root.remove();
    }

    this.createTag = function(prop, value) {
        let tagData = { prop: prop, value: value, display: propName };
        let tag = new Tag(tagData, this.removeTag.bind(this));
        tag.toggleEdit(true);
        tag.hideProperty();
        newTag.insertAdjacentElement("afterend", tag.root);
        return tag;
    }

    this.addTag = function() {
        let value = newValue.value;
        let tag = this.createTag(prop, value);
        this.data.map(taglist => taglist.addTag(prop, value));
        newValue.value = "";
    }

    this.toggleEdit = function(editable) {

        let values = new Set();
        for (let taglist of this.data)
            taglist.getValues(prop).map(value => values.add(value));
        display.innerText = Array.from(values).join(" / ");
        for (let tag of Array.from(tagValues.getElementsByClassName("tag")))
            tag.remove();
        for (let value of values)
            this.createTag(prop, value);

        if (editable) {
            display.remove();
            this.root.append(label);
            this.root.append(tagValues);
        } else {
            label.remove();
            tagValues.remove();
            this.root.append(display);
        }
        this.data.map(tag => tag.toggleEdit(editable));
    }
}
AggregateTaglist.prototype = Container;

export { Taglist, AggregateTaglist };
