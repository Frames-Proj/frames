/// <reference path="../../../db/low-level/typings/index.d.ts"/>

// theres already some code for this in app but I guess low-level has the good shyt
import { AuthorizationPayload, AuthResponse } from '../../../db/low-level/src/ts/auth';
import { SafeClient } from '../../../db/low-level/index';
import { NfsClient, NfsDirectoryInfo, SafeFile } from '../../../db/low-level/src/ts/nfs';
import * as stream from 'stream';
import * as fs from 'fs';

import Config from './global-config';
const CONFIG = Config.getInstance();

const authPayload : AuthorizationPayload = {
        app: {
            name: CONFIG.APP_NAME,
            id: CONFIG.APP_ID,
            version: CONFIG.APP_VERSION,
            vendor: CONFIG.APP_VENDOR
        },
        permissions: CONFIG.APP_PERMISSIONS
};

//a lot of this is taken from the test suite but f it, lets see where this goes
//also taken from app's video-manager.ts but uses the nfs api
export const client : SafeClient = new SafeClient(authPayload, CONFIG.SAFE_LAUNCHER_ENDPOINT);

// video library functions
//jacked from video-manager.ts
export class Video {
    private lPath: string;
    constructor(filePath: string) {
        this.lPath = filePath;
    }
    public get localPath(): string { return this.lPath; }
}
// get things ready for the api
(async () => {
	await client.nfs.dir.get('app', 'videos').catch((err) => {
		if (err.res.statusCode == 404) {
			(async () => {
				await client.nfs.dir.create('app', 'videos', true).catch((err) => {
					console.error(err);
					// oh god, what have I become?
				});
			})();
		}
	});
})();

// upload video to list
export async function uploadVideo(path : string, client : SafeClient) {
    const vBuffer : Buffer = fs.readFileSync(path);

	  const vStream : stream.Transform = new stream.PassThrough();
    await new Promise((resolve, reject) => {
        vStream.write(vBuffer, (err) => {
            resolve();
        });
    }).catch((err) => {console.log(`we should likely quit this routine ...\n ${err}`)});

	  const vFile : Promise<void>
        = client.nfs.file.create('app', 'test...', vStream,
	 							                 vBuffer.byteLength, 'application/octet-stream');

    await vFile.catch((err) => {
        if (err) throw err;
    });

    //print that new file just incase...
    const datFile = await client.nfs.file.get('app', 'testVideo');
    console.log(datFile.body.toString('utf-8'));
}

uploadVideo('/Users/abdisalan/test.txt', client);
