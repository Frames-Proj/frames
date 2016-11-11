

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
    permissions: string[]
}



export interface AuthResponse {
    token: string,
    permissions: string[]
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
export async function getAuth(payload: AuthorizationPayload, endpoint : string) : Promise<AuthResponse> {

    const authResponse : AuthResponse = 
        await WebRequest.create<AuthResponse>(endpoint + '/auth', {
            json: true,
            method: "POST",
            body: payload
        }).response.then( (res) => {
            return saneResponse(res).content;
        });

    return authResponse;
}
