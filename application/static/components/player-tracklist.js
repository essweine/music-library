import { createTracklistContainer } from "/static/components/tracklist-container.js";
import { createNextTracksEntry } from "/static/components/player-tracklist-entry.js";

function createPlayerTracklist(childClass) {

    let tracklist = createTracklistContainer(childClass);

    tracklist.heading = document.createElement("div");
    tracklist.heading.classList.add("tracklist-heading");
    tracklist.append(tracklist.heading);

    tracklist.tracklistHidden = true;
    tracklist.listToggle = document.createElement("div");
    tracklist.listToggle.classList.add("list-toggle");
    tracklist.listToggle.onclick = e => {
        tracklist.tracklistHidden = !tracklist.tracklistHidden;
        tracklist.updateToggle();
    };

    tracklist.update = tracklist._update;

    tracklist.shiftTrackUp = (position) => {
        tracklist._shiftTrackUp(position);
        tracklist.addToggle();
    }

    tracklist.removeTrack = (position) => {
        tracklist._removeTrack(position);
        tracklist.addToggle();
    }

    tracklist.addToggle = () => {
        tracklist.listToggle.remove();
        let children = tracklist.getElementsByClassName(tracklist.childClass);
        if (children.length > 1)
            tracklist.insertBefore(tracklist.listToggle, children.item(1));
    }

    tracklist.updateToggle = () => {
        let entries = tracklist.getElementsByClassName(tracklist.childClass);
        let action = (tracklist.tracklistHidden) ? "Expand" : "Collapse";
        let more = entries.length - 1
        if (more > 1)
            tracklist.listToggle.innerText = action + " (" + more + " more tracks)";
        else if (more == 1)
            tracklist.listToggle.innerText = action + " (" + more + " more track)";
        else
            tracklist.listToggle.remove();
        
        if (entries.length > 1)
            for (let i = 1; i < entries.length; i++)
                entries.item(i).style.display = (tracklist.tracklistHidden) ? "none" : "contents";
    }

    return tracklist;
}

function createNextTracksContainer() {

    let tracklist = createPlayerTracklist("next-tracks-entry");

    tracklist.id = "next-tracks";
    tracklist.heading.innerText = "Next Tracks";

    tracklist.update = (tracks) => {
        let entries = tracks.map(track => createNextTracksEntry(track));
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            entry.updatePosition(i, i == 0, i == entries.length - 1);
        }
        tracklist._update(entries);
        tracklist.addToggle();
        tracklist.updateToggle();
    }

    return tracklist;
}

export { createNextTracksContainer };
