import { Component } from "../component.js";

function TracklistEntry(position, track, classNames = [ ]) {

    let data = { position: position, track: track };
    Component.call(this, data, "div", classNames.concat([ "tracklist-entry" ]), null);

    this.updatePosition = function(position) { this.data.position = position; }

    this.addText = function(text, className) {
        let span = document.createElement("span");
        span.classList.add(className);
        span.innerText = text;
        this.root.append(span);
    }

}
TracklistEntry.prototype = new Component;

function Tracklist(childClass) {

    Component.call(this, { childClass: childClass }, "div", [ "tracklist" ], null);

    this.getItems = function() { return this.root.getElementsByClassName(this.data.childClass); }

    this.shiftTrackUp = function(position) {
        let children = this.getItems();
        let item = children.item(position);
        let prev = children.item(position - 1);
        this.root.removeChild(item);
        this.root.insertBefore(item, prev);
        item.updatePosition(position - 1, position - 1 == 0, position - 1 == children.length - 1);
        prev.updatePosition(position, position == 0, position == children.length - 1);
    }

    this.removeTrack = function(position) {
        let children = this.getItems();
        children.item(position).remove();
        for (let i = position; i < children.length; i++)
            children.item(i).updatePosition(i, i == 0, i == children.length - 1);
    }

    this.update = function(entries) {
        this.clear();
        for (let entry of entries)
            this.root.append(entry);
    }

    this.clear = function(tracklist) { 
        for (let track of Array.from(this.getItems()))
            track.remove();
    }

    this.addOptions = function(container, options, className, selectedClass) {
        for (let option of options) {
            let span = document.createElement("span");
            span.innerText = option.text;
            span.classList.add(className);
            span.onclick = () => {
                Array.from(document.getElementsByClassName(selectedClass)).map(e => e.classList.remove(selectedClass));
                span.classList.add(selectedClass);
                option.action();
            }
            container.append(span);
        }
        this.root.append(container);
    }
}
Tracklist.prototype = new Component;

export { Tracklist, TracklistEntry };
