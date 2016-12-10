

import * as WebRequest from 'web-request';
import { Request } from 'web-request';
import { saneResponse } from './util';
import { Either } from 'tsmonad';
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
function decodeAuthResponse(obj: {}): Either<any, AuthResponse> {
    if ('token' in obj && 'permissions' in obj) {
        return Either.right({
            token: obj['token'],
            permissions: obj['permissions']
        });
    } else {
        return Either.left(new Error(`${obj} is not an AuthResponse`));
    }
}


export async function getAuth(payload: AuthorizationPayload, endpoint : string) : Promise<AuthResponse> {

    const authResponse : AuthResponse = 
        await saneResponse(WebRequest.create<AuthResponse>(endpoint + '/auth', {
            json: true,
            method: "POST",
            body: payload
        }).response).then( (res) => {
            return decodeAuthResponse(res.content).caseOf({
                  right: (response) => { return response; }
                , left: (err) => { throw err; }
            });
        });

    return authResponse;
}
