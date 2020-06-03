class TracklistContainer extends HTMLDivElement {

    constructor() {
        super();
        this.childClass;
        this.addEventListener("move-track", e => this.shiftTrackUp(e.detail));
        this.addEventListener("remove-track", e => this.removeTrack(e.detail));
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
        for (let i = position; i < children.length; i++)
            children.item(i).updatePosition(i, i == 0, i == children.length - 1);
    }

    clear(tracklist) { 
        for (let track of Array.from(this.getElementsByClassName(this.childClass)))
            track.remove();
    }
}

export { TracklistContainer };
