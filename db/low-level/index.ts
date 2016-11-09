
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
import * as path from 'path';
import { getAuth, AuthorizationPayload, AuthResponse
         , decodeAuthResponse } from './src/ts/auth';
const mkpath = require('mkpath');

export class SafeClient {

    authRes: Promise<AuthResponse>;

    // TODO(ethan): use something besides a string to represent a filepath
    authPayload : AuthorizationPayload;
    cacheFile : string;
    reAuth : boolean;
    endpoint : string;


    constructor(authPayload: AuthorizationPayload, endpoint : string, cacheFile ?: string, reAuth ?: boolean) {

        if (reAuth === undefined) {
            this.reAuth = false;
        } else {
            this.reAuth = reAuth;
        }
        this.cacheFile = cacheFile;
        this.endpoint = endpoint;
        this.authPayload = authPayload;

        console.log("about to attempt authentication.");
        this.authRes = this.getCachedTokenOrAuthenticate();
    }

    public authenticated() : Promise<boolean> {
        return new Promise( (resolve, reject) => {
            this.authRes.then( (_) => resolve(true)).catch( (_) => resolve(false) );
        });
    }

    private async getCachedTokenOrAuthenticate() : Promise<AuthResponse> {
        if (this.cacheFile !== undefined || !this.reAuth) {
            await new Promise( (resolve, reject) => {
                mkpath(path.dirname(this.cacheFile), function(err) {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });

            const authResponse : AuthResponse =
                await new Promise<AuthResponse>( (resolve, reject) => {
                    fs.readFile(this.cacheFile, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            decodeAuthResponse(JSON.parse(data.toString())).then(resolve);
                        }
                    });
                }).catch( (_) => {
                    // TODO(ethan): actually cache the file in the getAuth call!
                    return getAuth(this.authPayload, this.endpoint, this.cacheFile);
                });

            return authResponse;
        } else {
            return getAuth(this.authPayload, this.endpoint, this.cacheFile);
        }
    }
    get authResponse(): Promise<AuthResponse> { return this.authRes; }
    /*
    get token(): Promise<string> {
        return this.authRes.then( res => {
            return Promise.resolve(res.token);
        });
    }
    */
    get permissions(): Promise<string[]> {
        return this.authRes.then( (res) => {
            return Promise.resolve(res.permissions);
        });
    }
};
