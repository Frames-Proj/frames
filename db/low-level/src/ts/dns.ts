
// File: dns.ts
//
// For using the dns api from the safe_launcher
//

import { AuthResponse } from "./auth";
import { RootPath, SafeFile } from "./nfs";
import { ApiClient, ApiClientConfig } from "./client";
import { saneResponse, SafeError } from "./util";
import * as stream from "stream";
import * as fs from "fs";

import * as WebRequest from "web-request";
import { Response } from "web-request";

export interface DnsHomeDirectory {
    info: {
        name: string;
        metadata: string;
        isPrivate: boolean;
        isVersioned: boolean;
        createdOn: Date;
        modifiedOn: Date;
    };
    subDirectories: string[];
    files: string[];
}

export type DnsServiceList = string[];
export type DnsLongNameList = string[];

export class DnsClient extends ApiClient {
    private mkendpoint(endpoint: string): string {
        return this.endpoint + `/dns${endpoint}`;
    }

    constructor(conf: ApiClientConfig) {
        super(conf);
    }

    /** @arg longName - public name that can be shared
     *  @returns a promise to say if the longName was registered
     */
    //NOTE only 'human readable' longNames are accepted
    // How that is defined, I have no clue, but try to use real words no random capitals
    public async register(longName: string): Promise<void> {
        const response = await saneResponse(WebRequest.post(
            this.mkendpoint(`/${longName}`), {
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }
    }

    /** @arg longName - public name that can be shared
     *  @arg serviceName - name of service mapped to longName
     *  @arg rootPath - app or drive
     *  @arg serviceHomeDirPath - the full path of the directory to be associated with to the service
     *  @returns a promise to say if the longName and service were registered
     */
    public async registerAndAddService(longName: string, serviceName: string,
                                       rootPath: RootPath, serviceHomeDirPath: string): Promise<void> {
        const Body = {
            "longName": longName,
            "serviceName": serviceName,
            "rootPath": rootPath,
            "serviceHomeDirPath": serviceHomeDirPath
        }

        const response = await saneResponse(WebRequest.post(
            this.mkendpoint(""), {
                auth: {
                    bearer: (await this.authRes).token
                },
                json: true,
                body: Body
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }
    }

    /** @arg longName - public name that can be shared
     *  @returns a list of services mapped to the longName
     */
    public async getServices(longName: string): Promise<DnsServiceList> {
        const response = await saneResponse(WebRequest.get(
            this.mkendpoint(`/${longName}`), {
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }

        return JSON.parse(response.content); //little sketchy
    }

    /** @arg longName - public name that can be shared
     *  @arg serviceName - name of service mapped to longName
     *  @arg rootPath - app or drive
     *  @arg serviceHomeDirPath - the full path of the directory to be associated with to the service
     *  @returns a promise to say if the longName and service were registered
     *
     *  TODO: (Abdi) maybe make this a generic function for the one above?
     */

    public async addService(longName: string, serviceName: string,
                            rootPath: RootPath, serviceHomeDirPath: string): Promise<void> {

        const Body = {
            "longName": longName,
            "serviceName": serviceName,
            "rootPath": rootPath,
            "serviceHomeDirPath": serviceHomeDirPath
        }

        const response = await saneResponse(WebRequest.put(
            this.mkendpoint(""), {
                auth: {
                    bearer: (await this.authRes).token
                },
                json: true,
                body: Body
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }
    }

    /** @arg longName - public name that can be shared
     *  @arg serviceName - name of service mapped to longName
     *  @returns a promise to a DnsHomeDirectory holding files and metadata
     *  TODO: (Abdi) Maybe make this a generic function with the get services method?
     */
    public async getHomeDirectory(longName: string, serviceName: string): Promise<DnsHomeDirectory> {
        const response = await saneResponse(WebRequest.get(
            this.mkendpoint(`/${serviceName}/${longName}`), {
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }

        return JSON.parse(response.content); //also little sketchy
    }

    /** @arg longName - public name that can be shared
     *  @arg serviceName - name of service mapped to longName
     *  @arg filePath - path to file you want
     *  @returns binary data of the file
     */
    public async getFile(longName: string, serviceName: string,
                         filePath: string, range?: [number, number]): Promise<SafeFile> {

        let payload: WebRequest.RequestOptions = {
            method: "GET",
            encoding: null,
            auth: {
                bearer: (await this.authRes).token
            }
        }

        if (range !== undefined) {
            payload["headers"] = {
                "Range": `bytes=${range[0]}-${range[1]}`
            };
        }

        const response: Response<Buffer> =
            await saneResponse(WebRequest.create<Buffer>(
                this.mkendpoint(`/${serviceName}/${longName}/${filePath}`), payload).response);

        return {
            headers: response.headers,
            body: response.content
        }
    }

    /** @arg longName - public name
     *  @arg serviceName - name of service mapped to longName
     *  @returns a promise that the service was removed
     */
    public async removeService(longName: string, serviceName: string): Promise<void> {
        const response = await saneResponse(WebRequest.delete(
            this.mkendpoint(`/${serviceName}/${longName}`), {
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }
    }

    /** @returns a promise of the list of longNames registered by the user
     */
    public async getLongNames(): Promise<DnsLongNameList> {
        const response = await saneResponse(WebRequest.get(
            this.mkendpoint(""), {
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }

        return JSON.parse(response.content); //little sketchy
    }

    /** @arg longName - public name to deregister
     *  @returns a promise that the longName has been deleted
     */
    public async deregister(longName: string): Promise<void> {
        const response = await saneResponse(WebRequest.delete(
            this.mkendpoint(`/${longName}`), {
                auth: {
                    bearer: (await this.authRes).token
                }
            }));

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`, response);
        }
    }
}
