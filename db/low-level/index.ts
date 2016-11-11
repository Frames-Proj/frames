
/// <reference path="./typings/index.d.ts" />

// A wrapper around the various `safe_launcher` API calls

//
// Usage Pattern:
//   You make a SafeClient object with an AuthorizationPayload,
//   then you make calls of the form:
//      - sc.<service>.<api call>(...) : Promise<whatever>
//   For example:
//      - sc.nfs.createFile(...) : Promise<whatever>
//

import * as fs from 'fs';
import { getAuth, AuthorizationPayload, AuthResponse
         , decodeAuthResponse } from './src/ts/auth';
import { ApiClientConfig } from './src/ts/client';
import { NfsClient } from './src/ts/nfs';

export class SafeClient {

    readonly authRes: Promise<AuthResponse>;
    readonly authPayload : AuthorizationPayload;
    readonly cacheFile : string;
    readonly reAuth : boolean;
    readonly endpoint : string;

    // sub-apis
    public readonly nfs : NfsClient;

    constructor(authPayload: AuthorizationPayload, endpoint : string, cacheFile ?: string, reAuth ?: boolean) {

        if (reAuth === undefined) {
            this.reAuth = false;
        } else {
            this.reAuth = reAuth;
        }
        this.cacheFile = cacheFile;
        this.endpoint = endpoint;
        this.authPayload = authPayload;


        this.authRes = getAuth(this.authPayload, this.endpoint);

        const apiClientConfig : ApiClientConfig = {
            authRes: this.authRes,
            endpoint: this.endpoint
        }

        this.nfs = new NfsClient(apiClientConfig);
    }

    public authenticated() : Promise<boolean> {
        return new Promise( (resolve, reject) => {
            this.authRes.then( (_) => resolve(true)).catch( (_) => resolve(false) );
        });
    }

    get authResponse(): Promise<AuthResponse> { return this.authRes; }
    get token(): Promise<string> {
        return this.authRes.then( res => {
            return Promise.resolve(res.token);
        });
    }
    get permissions(): Promise<string[]> {
        return this.authRes.then( (res) => {
            return Promise.resolve(res.permissions);
        });
    }
};
