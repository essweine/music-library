class PlaylistEntry extends HTMLDivElement {

    constructor() {
        super();

        this.classList.add("playlist-entry");

        this.trackTitle = document.createElement("span");
        this.trackTitle.classList.add("playlist-title");
        this.append(this.trackTitle);

        this.recording = document.createElement("span");
        this.recording.classList.add("playlist-recording");
        this.append(this.recording);

        this.artist = document.createElement("span");
        this.artist.classList.add("playlist-artist");
        this.append(this.artist);
    }

    initialize() {
        this.trackTitle.innerText = this.getAttribute("title");
        this.recording.innerText = this.getAttribute("recording");
        this.artist.innerText = this.getAttribute("artist");
    }
}

export { PlaylistEntry };
