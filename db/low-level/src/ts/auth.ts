

import * as WebRequest from 'web-request';
import { Request } from 'web-request';

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
            if (res.statusCode === 401) { // 401 means that we were denied by the user
                throw new Error('Auth denied by safe launcher.');
            } else if (res.statusCode === 404) {
                throw new Error(`endpoint=${endpoint} not found.`);
            } else if (res.statusCode !== 200) {
                throw new Error('Error authenticating.');
            } else {
                return res.content;
            }
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
