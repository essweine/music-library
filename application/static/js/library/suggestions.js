import { Container } from "../container.js";
import { RecordingList } from "./recording-list.js";
import { Options } from "../shared/widgets.js";

function SuggestionList(prefix, prefixText, getRecordings) {

    Container.init.call(this, "div", prefix + "-recordings");

    let officialList = new RecordingList(prefix + "-recordings-official");
    officialList.addHeading();
    getRecordings.call(this, true, officialList.update.bind(officialList));
    let nonofficialList = new RecordingList(prefix + "-recordings-nonofficial");
    nonofficialList.addHeading();
    getRecordings.call(this, false, nonofficialList.update.bind(nonofficialList));

    let options = new Options([ "suggestion-options" ], prefix + "-options");
    let updateView = (official) => {
        if (official) {
            nonofficialList.root.remove();
            this.root.append(officialList.root);
        } else {
            officialList.root.remove();
            this.root.append(nonofficialList.root);
        }
    }
    options.addOption("Official", updateView.bind(this, true));
    options.addOption("Nonofficial", updateView.bind(this, false));

    let heading = this.createElement("div", prefix + "-heading", [ "section-heading" ]);
    heading.innerText = prefixText;

    this.root.append(heading);
    this.root.append(options.root);
    this.root.append(officialList.root);
}
SuggestionList.prototype = Container;

function SuggestionManager() {
    Container.init.call(this, "div", "suggestion-manager");

    let onThisDate = new SuggestionList("on-this-date", "On This Date", this.onThisDate);
    this.root.append(onThisDate.root);

    let unlistened = new SuggestionList("unlistened", "Unlistened", this.unlistened);
    this.root.append(unlistened.root);

    let randomRecordings = new SuggestionList("random", "Randomly Selected Recordings", this.randomRecordings);
    this.root.append(randomRecordings.root);
}
SuggestionManager.prototype = Container;

export { SuggestionManager };
