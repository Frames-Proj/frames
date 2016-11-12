
/// <reference path="../../typings/index.d.ts" />

// File: nfs.ts
//
// For talking to the nfs portion of the safe_launcer api
//

import { AuthResponse } from './auth';
import { ApiClient, ApiClientConfig } from './client';
import { saneResponse } from './util';
import * as stream from 'stream';

import * as WebRequest from 'web-request';
import { Response } from 'web-request';

export class NfsClient extends ApiClient {

    public readonly dir : NfsDirectoryClient;
    public readonly file: NfsFileClient;

    constructor(conf: ApiClientConfig){
        super(conf);
        this.dir = new NfsDirectoryClient(conf);
        this.file = new NfsFileClient(conf);
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

class NfsDirectoryClient extends ApiClient {
    constructor(conf: ApiClientConfig){
        super(conf);
    }

    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @returns a promise to deliver some directory information
     */
    public async get(rootPath : string, directoryPath : string) : Promise<NfsDirectoryInfo> {
        const res : Response<string> = await saneResponse(WebRequest.get(
            this.endpoint + `/nfs/directory/${rootPath}/${directoryPath}`, {
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        // @unsafe
        return JSON.parse(res.content);
    }

    // TODO(ethan): test the metadata
    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @arg isPrivate - directory permissions
     *  @arg metadata - optional metadata about the directory. Should be a base64 string.
     *  @returns a promise to say if the directory was really created
     */
    public async create(rootPath : string, directoryPath : string,
                                 isPrivate : boolean, metadata ?: string) : Promise<boolean> {
        // console.log(`createDirectory:: rootPath=${rootPath} directoryPath=${directoryPath}`);

        let recBody = {
            'isPrivate': isPrivate
        }
        if (metadata !== undefined) {
            recBody['metadata'] = metadata;
        }

        const result = await saneResponse(WebRequest.post(
            this.endpoint + `/nfs/directory/${rootPath}/${directoryPath}`, {
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                },
                body: recBody
            }));

        return result.statusCode == 200;
    }

    // TODO(ethan): add return type
    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @returns a promise to say if the directory was really deleted 
     */
    public async delete(rootPath : string, directoryPath : string) : Promise<boolean> {
        const result = await saneResponse(WebRequest.delete(
            this.endpoint + `/nfs/directory/${rootPath}/${directoryPath}`, {
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        return result.statusCode == 200;
    }

    // TODO(ethan): update directory
    // TODO(ethan): move directory 
}

interface SafeFile {
    headers: any, // TODO(abdi): give this a type
    body: string 
}

class NfsFileClient extends ApiClient {
    constructor(conf: ApiClientConfig){
        super(conf);
    }

    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg filePath - the path to the directory
     *  @arg file - the actual data. The whole `file` buffer wil be sent, so make sure that
     *                it contains ~only~ the data you want to send (no garbage at the end).
     *  @arg size - the size of the file
     *  @arg contentType - the Mime content type
     *  @arg metadata - optional metadata about the directory.
     *  @returns a promise to create the file
     */
    public async create(rootPath : string, filePath : string, file : stream.Readable, size : number, contentType : string, metadata ?: Buffer) : Promise<void> {
        console.log(`createDirectory:: rootPath=${rootPath} directoryPath=${filePath}`);

        let payload = {
            encoding: null,
            method: 'POST',
            headers: {
                'Content-Type': contentType,
                'Content-Length': size,
            },
            auth: {
                bearer: (await this.authRes).token
            },
            body: file
        };

        if (metadata !== undefined) {
            payload['headers']['Metadata'] = metadata.toString('base64');
        }

        console.log('about to make request!!');
        const request = file.pipe(WebRequest.create(
            this.endpoint + `/nfs/file/${rootPath}/${filePath}`, payload));
        console.log('just made request!!');
        const response = await saneResponse(request.response);
    }

    // TODO(ethan): find out the type this should respond with
    // TODO(ethan): support the range parameter (this would be how we do streaming). Test it.
    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg filePath - the path to the directory
     *  @arg range - an optional range of the file to get
     *  @returns a promise containing the file contents, and request headers
     */
    public async get(rootPath : string, filePath : string, range ?: [number, number]) : Promise<SafeFile> {

        let payload = {
            auth: {
                bearer: (await this.authRes).token
            }
        };

        if (range !== undefined) {
            payload['headers'] = {
                'Range': `bytes=${range[0]}-${range[1]}`
            };
        }

        const res : Response<string> = await saneResponse(WebRequest.get(
            this.endpoint + `/nfs/file/${rootPath}/${filePath}`, payload));

        console.log(`typeof res.body=${typeof res.content}`);
        console.log(`typeof res.headers=${typeof res.headers}`);
        // TODO(ethan): figure out the best way to send the body back
        console.log(`res.body=${res.content}`);
        console.log(`res.headers=${JSON.stringify(res.headers)}`);

        // @unsafe
        return {
            headers: res.headers,
            body: res.content
        };
    }
}
