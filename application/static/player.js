import { PlayerContainer, createPlayerContainer } from "/static/components/player-container.js";
import { CurrentTrack } from "/static/components/current-track.js";
import { NextTracksContainer, RecentlyPlayedContainer } from "/static/components/player-tracklist.js";
import { NextTracksEntry, RecentlyPlayedEntry } from "/static/components/player-tracklist-entry.js";
import { PlayerControls } from "/static/components/player-controls.js";
import { Player } from "/static/modules/api.js";

customElements.define("player-container", PlayerContainer, { extends: "div" });
customElements.define("current-track", CurrentTrack, { extends: "div" });
customElements.define("player-controls", PlayerControls, { extends: "div" });
customElements.define("next-tracks", NextTracksContainer, { extends: "div" });
customElements.define("recently-played", RecentlyPlayedContainer, { extends: "div" });
customElements.define("next-tracks-entry", NextTracksEntry, { extends: "div" });
customElements.define("recently-played-entry", RecentlyPlayedEntry, { extends: "div" });

import { UpArrow, DownArrow, RemoveButton } from "/static/components/tracklist-actions.js";
import { RatingContainer } from "/static/components/rating-container.js";

customElements.define("up-arrow", UpArrow, { extends: "span" });
customElements.define("down-arrow", DownArrow, { extends: "span" });
customElements.define("remove-button", RemoveButton, { extends: "span" });
customElements.define("rating-container", RatingContainer, { extends: "span" });

window.onload = e => { createPlayerContainer(); }
