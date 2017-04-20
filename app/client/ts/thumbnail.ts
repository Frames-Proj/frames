//
// Generate a video thumbnail from a video file.
//

import { exec } from "child_process";
import { makeRandStr } from "./util";
import * as fs from "fs";


export class FfmepgCommandFailed extends Error {
    public err: any;
    constructor(message: string, err: any) {
        super(message);
        this.err = err;
    }
}

//
// A function from a path to a video file to a promise to a
// path the the thumbnail file.
//
export default function extractThumbnail(videoFile: string): Promise<string> {
    const tmpFile: string = `/tmp/frames-tmp-thumbnail-${makeRandStr()}.png`;
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${videoFile} -ss 00:00:00 -vf scale=200:-1 -vframes 1 ${tmpFile}`,
                (err, stdout, stderr) => {
            if (err) reject(new FfmepgCommandFailed("Ffmpeg command failed.", err));
            else resolve(tmpFile);
        });
    });
}
