class TracklistContainer extends HTMLDivElement {

    constructor() {
        super();
        this.addEventListener("move-track", e => this.shiftTrackUp(e.detail));
        this.addEventListener("remove-track", e => this.removeTrack(e.detail));
    }

    update(tracklist) { 
        let children = Array.from(this.getElementsByClassName(this.childClass));
        for (let track of children)
            track.remove();

        for (let position in tracklist) {
            let track = tracklist[position];
            let entry = document.createElement("div", { is: this.childClass });
            for (let attribute of this.childAttributes)
                if (track[attribute] != null)
                    entry.setAttribute(attribute, track[attribute])
            entry.initialize();
            entry.updatePosition(position, position == 0, position == tracklist.length - 1);
            this.append(entry);
        }
    }

    shiftTrackUp(position) {
        let children = this.getElementsByClassName(this.childClass);
        let item = children.item(position);
        let prev = children.item(position - 1);
        this.removeChild(item);
        this.insertBefore(item, prev);
        item.updatePosition(position - 1, position - 1 == 0, position - 1 == children.length - 1);
        prev.updatePosition(position, position == 0, position == children.length - 1);
    }

    removeTrack(position) {
        let children = this.getElementsByClassName(this.childClass);
        children.item(position).remove();
        for (let i = position; i < tracklist.length; i++)
            children.item(i).updatePosition(i, i == 0, i == children.length - 1);
    }
}

export { TracklistContainer };
