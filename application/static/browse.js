import { Recording } from "/static/modules/api.js";
import { Player } from "/static/modules/player.js";
import { RecordingListing } from "/static/components/recording-listing.js";

customElements.define("recording-listing", RecordingListing, { extends: "div" });
