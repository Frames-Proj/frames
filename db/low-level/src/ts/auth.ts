

import * as WebRequest from 'web-request';
import { Request } from 'web-request';
import { saneResponse } from './util';
import * as path from 'path';
const mkpath = require('mkpath');

import * as fs from 'fs';

export interface AuthorizationPayload {
    app: {
        name: string,
        id: string,
        version: string,
        vendor: string
    },
    permissions: Array<string>
}



export interface AuthResponse {
    token: string,
    permissions: Array<string>
}

// TODO(ethan): define a FromJson interface to do this instead.
export function decodeAuthResponse(obj: {}): Promise<AuthResponse> {
    if ('token' in obj && 'permissions' in obj) {
        return Promise.resolve({
            token: obj['token'],
            permissions: obj['permissions']
        });
    } else {
        return Promise.reject(new Error(`${obj} is not an AuthResponse`));
    }
}


// This function impliments authorization caching. It just stores
// the app auth token in the clear in a file called auth.dat
export async function getAuth(payload: AuthorizationPayload, endpoint : string, cacheFile ?: string) : Promise<AuthResponse> {

    const authResponse : AuthResponse = 
        await WebRequest.create<AuthResponse>(endpoint + '/auth', {
            json: true,
            method: "POST",
            body: payload
        }).response.then( (res) => {
            return saneResponse(res).content;
        });

    if (cacheFile !== undefined) {
        await new Promise( (resolve, reject) => {
            fs.writeFile(cacheFile, JSON.stringify(authResponse), (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    return authResponse;
}

// this is only exposed to make unit testing each client class in isolation
// easier
export async function getCachedTokenOrAuthenticate(
    authPayload : AuthorizationPayload, endpoint : string,
    reAuth : boolean, cacheFile ?: string) : Promise<AuthResponse> {

    // console.log(`getCachedTokenOrAuthenticate:: reAuth=${reAuth} cacheFile=${cacheFile}`);

    if (cacheFile !== undefined || !reAuth) {
        await new Promise( (resolve, reject) => {
            mkpath(path.dirname(cacheFile), function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });

        const authResponse : AuthResponse =
            await new Promise<AuthResponse>( (resolve, reject) => {
                fs.readFile(cacheFile, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        decodeAuthResponse(JSON.parse(data.toString())).then(resolve);
                    }
                });
            }).catch( (_) => {
                // TODO(ethan): actually cache the file in the getAuth call!
                return getAuth(authPayload, endpoint, cacheFile);
            });

        return authResponse;
    } else {
        return getAuth(authPayload, endpoint, cacheFile);
    }
}
