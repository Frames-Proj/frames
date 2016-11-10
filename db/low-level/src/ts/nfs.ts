

// File: nfs.ts
//
// For talking to the nfs portion of the safe_launcer api
//

import { AuthResponse } from './auth';
import { ApiClient, ApiClientConfig } from './client';
import { saneResponse } from './util';

import * as WebRequest from 'web-request';
import { Response } from 'web-request';

export class NfsClient extends ApiClient {

    public readonly dir : NfsDirectoryClient;

    constructor(conf: ApiClientConfig){
        super(conf);
        this.dir = new NfsDirectoryClient(conf);
    }

}

export interface NfsDirectoryInfo {
    info : {
        name : string,
        isPrivate : boolean,
        createdOn: string,
        modifiedOn: string,
        metadata: string
    },
    files: any[], // TODO(ethan): find out the actual types for this
    subDirectories: any[] 
}

export class NfsDirectoryClient extends ApiClient {
    constructor(conf: ApiClientConfig){
        super(conf);
    }

    public alwaysTrue() : boolean { return true; }

    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @returns a promise to deliver some directory information
     */
    public async getDirectory(rootPath : string, directoryPath : string) : Promise<NfsDirectoryInfo> {
        const res : Response<string> = await WebRequest.get(
            this.endpoint + `/nfs/directory/${rootPath}/${directoryPath}`, {
                method: "GET",
                auth: {
                    bearer: (await this.authRes).token
                }
            });

        // @unsafe
        return JSON.parse(saneResponse(res).content);
    }

    // TODO(ethan): give an actual type to this thing
    // TODO(ethan): test the metadata
    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @arg isPrivate - directory permissions
     *  @arg metadata - optional metadata about the directory. Should be a base64 string.
     *  @returns a promise to say if the directory was really created
     */
    public async createDirectory(rootPath : string, directoryPath : string,
                                 isPrivate : boolean, metadata ?: string) : Promise<boolean> {
        // console.log(`createDirectory:: rootPath=${rootPath} directoryPath=${directoryPath}`);

        let recBody = {
            'isPrivate': isPrivate
        }
        if (metadata !== undefined) {
            recBody['metadata'] = metadata;
        }

        const result = await WebRequest.post(
            this.endpoint + `/nfs/directory/${rootPath}/${directoryPath}`, {
                json: true,
                method: "POST",
                auth: {
                    bearer: (await this.authRes).token
                },
                body: recBody
            }).then(saneResponse);

        return result.statusCode == 200;
    }

}

/*
return WebRequest.post(endpoint + `/nfs/directory/app/${directoryName}`, {
    json: true,
    method: "POST",
    auth: {
        bearer: authRes.token
    },
    body: {
        "isPrivate": true
    }
}).then( (res) => {
    if (res.statusCode == 200) {
        console.log("created directory!");
        return Promise.resolve(true);
    } else {
        throw new SAFEDirCreationError();
    }
});
*/
