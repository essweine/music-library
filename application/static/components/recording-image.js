class RecordingImage extends HTMLDivElement {
    constructor() {
        super();
        this.id = "recording-image";

        this.img = document.createElement("img");
        this.img.id = "recording-artwork";
        this.append(this.img);

        this.select = document.createElement("select");
        this.select.oninput = e => this.img.src = "/file/" + e.target.value;
    }

    addImage(image, directory) {
        let option = document.createElement("option");
        option.value = image;
        option.innerText = image.replace(directory + "/", "");
        this.select.append(option);
    }

    selectImage(image) {
        this.img.src = "/file/" + image;
        for (let option of this.select.options)
            if (option.value == image)
                option.selected = true;
    }

    toggleEdit(editable) { (editable) ? this.append(this.select) : this.select.remove(); }
}

function createRecordingImage(images, directory, selected = null) {
    let recordingImage = document.createElement("div", { is: "recording-image" });
    for (let image of images)
        recordingImage.addImage(image, directory);
    (selected != null) ? recordingImage.selectImage(selected) : recordingImage.selectImage(images[0]);
    return recordingImage;
}

export { RecordingImage, createRecordingImage };
