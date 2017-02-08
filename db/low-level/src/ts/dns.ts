
// File: dns.ts
//
// For using the dns api from the safe_launcher
//

import { AuthResponse } from "./auth";
import { RootPath } from "./nfs";
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
        let Body = {
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

        let Body = {
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

}
