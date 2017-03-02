

//
// I don't really know what the right architectural choice is here
//

import * as fs from "fs";
import * as WebRequest from "web-request";

import Config from './global-config';
const CONFIG : Config = Config.getInstance();

import { AuthResponse, Auth } from './auth';

const mkpath = require('mkpath');

const VIDEO_DIR : string = CONFIG.APP_HOME_DIR + "/videos";

export async function getVideo(safeDir: string, safeFile: string): Promise<Video> {

    await new Promise( (resolve, reject) => {
        mkpath(VIDEO_DIR, function(err) {
            if (err)
                return reject(err);
            else
                return resolve();
        });
    });

    const localPath : string = VIDEO_DIR + `/${safeFile}`;
    const auth : AuthResponse = await Auth.getInstance().authResponse;
    await loadFileContents(auth, safeDir, safeFile, localPath);

    return Promise.resolve(new Video(localPath));
}

export class Video {
    private lPath: string;
    constructor(filePath: string) {
        this.lPath = filePath;
    }
    public get localPath(): string { return this.lPath; }
}

// returns the name of the local file that has been downloaded to
async function loadFileContents( authRes : AuthResponse
                               , folder: string
                               , fileName: string
                               , tgtFile: string): Promise<void> {

                                   
    // just a get request
    let fileReq =
    await WebRequest.create(CONFIG.SAFE_LAUNCHER_ENDPOINT
                            + `/nfs/file/app/${folder}/${fileName}`, {
            method: "GET",
            encoding: null, // get us some binary data
            auth: {
                bearer: authRes.token
            }
        });

    // const localPath : string = `${VIDEO_DIR}/${fileName}`;
    fileReq.pipe(fs.createWriteStream(tgtFile));

    return fileReq.response.then( (_) => {
        return Promise.resolve();
    });

    //console.log(`loadFileContents:: statusCode=${fileResponse.statusCode}`);
    //console.log(`loadFileContents:: content=${fileResponse.content}`);
}
