function createTracklistContainer(childClass) {

    let container = document.createElement("div");
    container.childClass = childClass;

    container.addEventListener("move-track", e => container.shiftTrackUp(e.detail));
    container.addEventListener("remove-track", e => container.removeTrack(e.detail));

    container._shiftTrackUp = (position) => {
        let children = container.getElementsByClassName(container.childClass);
        let item = children.item(position);
        let prev = children.item(position - 1);
        container.removeChild(item);
        container.insertBefore(item, prev);
        item.updatePosition(position - 1, position - 1 == 0, position - 1 == children.length - 1);
        prev.updatePosition(position, position == 0, position == children.length - 1);
    }

    container._removeTrack = (position) => {
        let children = container.getElementsByClassName(container.childClass);
        children.item(position).remove();
        for (let i = position; i < children.length; i++)
            children.item(i).updatePosition(i, i == 0, i == children.length - 1);
    }

    // I can't figure out how to effectively inherit from html elements so I'm giving up and
    // just creating an element and assigning methods to it because I generally don't need a
    // class hierarchy.  Except in this case, where I need to call and override these methods.
    container.shiftTrackUp = container._shiftTrackUp;
    container.removeTrack = container._removeTrack;

    container.clear = (tracklist) => { 
        for (let track of Array.from(container.getElementsByClassName(container.childClass)))
            track.remove();
    }

    return container;
}

export { createTracklistContainer };
