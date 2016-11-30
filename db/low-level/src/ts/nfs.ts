
/// <reference path="../../typings/index.d.ts" />

// File: nfs.ts
//
// For talking to the nfs portion of the safe_launcer api
//

import { AuthResponse } from './auth';
import { ApiClient, ApiClientConfig } from './client';
import { saneResponse, SafeError } from './util';
import * as stream from 'stream';

import * as WebRequest from 'web-request';
import { Response } from 'web-request';

export type RootPath = 'app' | 'drive';

export class NfsClient extends ApiClient {

    public readonly dir : NfsDirectoryClient;
    public readonly file: NfsFileClient;

    constructor(conf: ApiClientConfig){
        super(conf);
        this.dir = new NfsDirectoryClient(conf);
        this.file = new NfsFileClient(conf);
    }

}

export interface NfsFileData {
    name : string,
    createdOn: string,
    modifiedOn: string,
    metadata: string
}
export interface NfsDirectoryData {
    name : string,
    isPrivate : boolean,
    createdOn: string,
    modifiedOn: string,
    metadata: string
}
export interface NfsDirectoryInfo {
    info : NfsDirectoryData
    files: NfsFileData[],
    subDirectories: NfsDirectoryData[] 
}

class NfsDirectoryClient extends ApiClient {
    private mkendpoint(rootPath : RootPath, dirPath : string) : string {
        return this.endpoint + `/nfs/directory/${rootPath}/${dirPath}`;
    }

    constructor(conf: ApiClientConfig){
        super(conf);
    }

    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @returns a promise to deliver some directory information
     */
    public async get(rootPath : RootPath, directoryPath : string) : Promise<NfsDirectoryInfo> {
        const res : Response<string> = await saneResponse(WebRequest.get(
            this.mkendpoint(rootPath, directoryPath), {
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
     *  @arg metadata - optional metadata about the directory.
     *  @returns a promise to say if the directory was really created
     */
    public async create(rootPath : RootPath, directoryPath : string,
                        isPrivate : boolean, metadata ?: string) : Promise<void> {

        let recBody = {
            'isPrivate': isPrivate
        }
        if (metadata !== undefined) {
            recBody['metadata'] = new Buffer(metadata).toString('base64');
        }

        const result = await saneResponse(WebRequest.post(
            this.mkendpoint(rootPath, directoryPath), {
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                },
                body: recBody
            }));

        if (result.statusCode !== 200) {
            throw new SafeError(`statusCode=${result.statusCode} !== 200`, result);
        }
    }

    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @returns a promise to say if the directory was really deleted 
     */
    public async delete(rootPath : RootPath, directoryPath : string) : Promise<void>
    {
        const result = await saneResponse(WebRequest.delete(
            this.mkendpoint(rootPath, directoryPath), {
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (result.statusCode !== 200) {
            throw new SafeError(`statusCode=${result.statusCode} !== 200`, result);
        }
    }

    // TODO(ethan): test the metadata
    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg directoryPath - the path to the directory
     *  @arg newName - the new directory name
     *  @arg newMetadata - the new directory metadata
     *  @returns a promise to say if the directory was really deleted 
     */
    public async update(rootPath : RootPath, directoryPath : string,
                        newName : string, newMetadata ?: string) : Promise<void>
    {
        let recBody = {
            'name': newName
        }
        if (newMetadata !== undefined) {
            recBody['metadata'] = new Buffer(newMetadata).toString('base64');
        }

        const result = await saneResponse(WebRequest.put(
            this.mkendpoint(rootPath, directoryPath), {
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                },
                body: recBody
            }));

        if (result.statusCode !== 200) {
            throw new SafeError(`statusCode=${result.statusCode} !== 200`, result);
        }
    }
    
    private async moveOrCopy(srcRootPath : RootPath, srcDirPath : string,
                             dstRootPath : RootPath, dstDirPath : string,
                             action : 'move' | 'copy') : Promise<void>
    {

        const result = await saneResponse(WebRequest.create(
            this.endpoint + '/nfs/movedir', {
                json: true,
                method: 'POST',
                auth: {
                    bearer: (await this.authRes).token
                },
                body: {
                    srcRootPath: srcRootPath,
                    srcPath: srcDirPath,
                    destRootPath: dstRootPath,
                    destPath: dstDirPath,
                    action: action
                }
            }).response);

        if (result.statusCode !== 200) {
            throw new SafeError(`statusCode=${result.statusCode} !== 200`, result);
        }
    }

    public async move(srcRootPath : RootPath, srcDirPath : string,
                      dstRootPath : RootPath, dstDirPath : string) : Promise<void>
    {
        return this.moveOrCopy(srcRootPath, srcDirPath, dstRootPath, dstDirPath, 'move');
    }
    public async copy(srcRootPath : RootPath, srcDirPath : string,
                      dstRootPath : RootPath, dstDirPath : string) : Promise<void>
    {
        return this.moveOrCopy(srcRootPath, srcDirPath, dstRootPath, dstDirPath, 'copy');
    }
}

export interface SafeFile {
    headers: WebRequest.Headers,
    body: Buffer
}

class NfsFileClient extends ApiClient {
    private mkendpoint(rootPath : RootPath, filePath: string) : string {
        return this.endpoint + `/nfs/file/${rootPath}/${filePath}`;
    }

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
    public async create(rootPath : RootPath, filePath : string, file : NodeJS.ReadableStream,
                        size : number, contentType : string, metadata ?: Buffer) : Promise<void>
    {

        let payload = {
            encoding: null,
            method: 'POST',
            headers: {
                'Content-Type': contentType,
                'Content-Length': size,
            },
            auth: {
                bearer: (await this.authRes).token
            }
        };

        if (metadata !== undefined) {
            payload['headers']['Metadata'] = metadata.toString('base64');
        }

        const request = file.pipe(WebRequest.create(this.mkendpoint(rootPath, filePath), payload));

        const response = await saneResponse(request.response);

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }
    }

    // TODO(ethan): test the range header
    /** @arg rootPath - either 'app' or 'drive' 
     *  @arg filePath - the path to the directory
     *  @arg range - an optional range of the file to get
     *  @returns a promise containing the file contents, and request headers
     */
    public async get(rootPath : RootPath, filePath : string,
                     range ?: [number, number]) : Promise<SafeFile>
    {

        let payload : WebRequest.RequestOptions = {
            method: "GET",
            encoding: null, // force a buffer response
            auth: {
                bearer: (await this.authRes).token
            }
        };

        if (range !== undefined) {
            payload['headers'] = {
                'Range': `bytes=${range[0]}-${range[1]}`
            };
        }

        // @unsafe
        const res : Response<Buffer> =
            await saneResponse(WebRequest.create<Buffer>(this.mkendpoint(rootPath, filePath),
                                                         payload).response);

        return {
            headers: res.headers,
            body: res.content
        };

    }

    public async delete(rootPath : RootPath, filePath : string) : Promise<void>
    {
        const result = await saneResponse(WebRequest.delete(
            this.mkendpoint(rootPath, filePath), {
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (result.statusCode !== 200 || result.content !== "OK") {
            throw new SafeError(`statusCode=${result.statusCode} !== 200`, result);
        }
    }
}
