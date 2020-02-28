let Player = {

    url: "/api/player",

    startTask: { "name": "start" },
    stopTask: { "name": "stop" },

    clearAll: function(nextEntries) {
        let tasks = [ ];
        for (let i = 0; i < nextEntries.length; i++)
            tasks.push({
                "name": "remove",
                "position": 0
            });
    },

    playAll: function(recording) {
        let tracks = recording.tracks;
        let tasks = [ ];
        for (let track of tracks)
            tasks.unshift(this.addToPlaylistTask(track, recording, 0));
        tasks.push(this.startTask);
        this.sendTasks(tasks);
    },

    addToPlaylistTask: function(track, recording, position = null) {
        let track_data = {
            filename: track.filename,
            title: track.title,
            rating: track.rating,
            recording_id: track.recording_id,
            recording: recording.title,
            artist: recording.artist,
            artwork: recording.artwork
        }
        return {
            "name": "add",
            "track_data": track_data,
            "position": position
        }
    },

    sendTasks: function(tasks) {
        let data = { "tasks": tasks };
        let request = new XMLHttpRequest();
        request.open("POST", this.url);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(data));
    }
}

export { Player }
