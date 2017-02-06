// File: upload.ts
//
// The script for uploading a file

import * as $ from "jquery";
const remote = require('electron').remote;

import { fileExists, safeClient } from "./util";

async function uploadVideo(localVideoFile: string,
                           videoTitle: string,
                           description: string): Promise<void>
{
    // TODO: real video format classification. i.e. don't just assume ogg
    safeClient.nfs.file
        .createFromLocalFile("app", localVideoFile, `videos/${videoTitle}`, "video/ogg")
        .catch( (err) => {
            console.error(err); // TODO: actual error handling
            console.error(JSON.stringify(err));
        });
}

//
// UI code
//

$(document).ready(() => {

    let video = $("#video-input");

    // ensure videos directory exists
    safeClient.nfs.dir.create("app", "videos", false);

    video.click( () => {
        remote.dialog.showOpenDialog({
            title: "Upload Video",
            properties: ["openFile"]
        }, (file) => {
            video.val(file);
        });
    });

    $("#submit").click(async () => {
        const videoFile = $("#upload-container #video-input").val();
        const title = $("#upload-container #title").val();
        const description = $("#upload-container #desc").val();

        console.log(`calling uploadVideo(${videoFile}, ${title}, ${description})`);
        await uploadVideo(videoFile, title, description);
    });

});

