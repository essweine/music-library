class Recording {
    constructor() {
        this.base = "/api/recording";
    }

    get(recordingId, callback) {
        let url = this.base + "/" + recordingId;
        let request = new XMLHttpRequest();
        request.addEventListener("load", e => this.parseResponse(e, callback));
        request.open("GET", url);
        request.send();
    }

    updateRating(recordingId, data) {
        let request = new XMLHttpRequest();
        request.open("PUT", this.base + "/" + recordingId + "/rating");
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(data));
    }

    parseResponse(e, callback) {
        let recording = JSON.parse(e.target.response);
        callback(recording);
    }
}

export { Recording };
