function createRecordingImage(images, directory, selected = null) {

    let container = document.createElement("div");
    container.id = "recording-image";

    container.img = document.createElement("img");
    container.img.id = "recording-artwork";
    container.append(container.img);

    container.select = document.createElement("select");
    container.select.oninput = e => container.img.src = "/file/" + e.target.value;

    container.addImage = (image, directory) =>  {
        let option = document.createElement("option");
        option.value = image;
        option.innerText = image.replace(directory + "/", "");
        container.select.append(option);
    }

    container.selectImage = (image) => {
        container.img.src = "/file/" + image;
        for (let option of container.select.options)
            if (option.value == image)
                option.selected = true;
    }

    container.toggleEdit = (editable) => { (editable) ? container.append(container.select) : container.select.remove(); }

    for (let image of images)
        container.addImage(image, directory);
    (selected != null) ? container.selectImage(selected) : container.selectImage(images[0]);

    return container;
}

export { createRecordingImage };
