// File: upload.ts
//
// The script for uploading a file

import * as $ from "jquery";

import { remote } from "electron";
import { fileExists, safeClient } from "./util";

async function uploadVideo(localVideoFile: string,
                           videoTitle: string,
                           description: string): Promise<void>
{
    // TODO: real video format classification.
    safeClient.nfs.file
        .createFromLocalFile("app", localVideoFile, `videos/${videoTitle}`, "video/ogg")
        .catch( (err) => {
            console.error(err); // TODO: actual error handling
        });
}

//
// UI code
//

$(document).ready(() => {

    let video = $("#video-input");

    video.click( () => {
        remote.dialog.showOpenDialog({
            title: "Upload Video",
            properties: ["openFile"]
        }, (file) => {
            video.val(file);
        });
    });

    $("#submit").click( () => {
        const videoFile = $("#upload-container #video-input").val();
        const title = $("#upload-container #title").val();
        const description = $("#upload-container #desc").val();

        console.log(`${videoFile}, ${title}, ${description}`);
    });

});

