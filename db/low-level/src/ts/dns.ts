
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

export class DnsClient extends ApiClient {
    private mkendpoint(endpoint: string): string {
        return this.endpoint + `/dns${endpoint}`;
    }

    /** @arg longName - public name that can be shared
     *  @returns a promise to say if the longName was registered
     */
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
}
