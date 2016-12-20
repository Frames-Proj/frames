

// We use the nodejs fs module to read files and stream them to
// the network
import * as fs from "fs";
// WebRequests is a thin wrapper around js's flagship requests library.
// It adds types and promises in a very non-invasive way.
import * as WebRequest from "web-request";
import { Request } from "web-request";

import { SAFEAuthError, InstantiationError } from "./error";
import { unPromise, id } from "./util";

const mkpath = require('mkpath');

import Config from './global-config';
const CONFIG = Config.getInstance();

const AUTH_FILE_NAME : string = CONFIG.APP_HOME_DIR + "/auth.dat";

interface AuthorizationPayload {
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

export class Auth {
    // On construction Auth gets an authentication token
    // for the app using the following simple algorithm:
    //
    // 1) Check in CONFIG.APP_HOME_DIR/auth.dat for the token
    //
    // 2) If the token is not cached, ask the network for it

    static authPayload : AuthorizationPayload = {
        app: {
            name: CONFIG.APP_NAME,
            id: CONFIG.APP_ID,
            version: CONFIG.APP_VERSION,
            vendor: CONFIG.APP_VENDOR
        },
        permissions: CONFIG.APP_PERMISSIONS
    }

    authRes: Promise<AuthResponse>;

    static _instance : Auth = new Auth();

    constructor() {
        if(Auth._instance){
            throw new InstantiationError("Auth");
        }

        this.authRes = getAuth(Auth.authPayload);

        this.authRes.catch( (fail) => {
            console.log("WE GOT AN ERROR (1)");

            console.log(fail.toString());
        });

        console.log(`Auth:: authRes=${this.authRes}`);

        Auth._instance = this;
    }

    static getInstance(): Auth { return this._instance; }

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
}



// This function impliments authorization caching. It just stores
// the app auth token in the clear in a file called auth.dat
async function getAuth(payload: AuthorizationPayload) : Promise<AuthResponse> {
    console.log(`auth file: ${AUTH_FILE_NAME}`);

    const createDir = new Promise( (resolve, reject) => {
        mkpath(CONFIG.APP_HOME_DIR, function(err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });

    // first we try to see if the authorization token is already here
    const authBlob : Promise<AuthResponse> =
    createDir.then( (_) => {
        return new Promise<AuthResponse>( (resolve, reject) => {
            fs.readFile(AUTH_FILE_NAME, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(JSON.parse(data.toString()));
                }
            });
        });
    }).catch( (err) => {
        // if the auth file does not exist, we ask the safe_launcher
        // for a token.
        console.log("failed to open file! !");

        const authResponse : Promise<AuthResponse> = 
            WebRequest.create<AuthResponse>(CONFIG.SAFE_LAUNCHER_ENDPOINT + '/auth', {
                json: true,
                method: "POST",
                body: payload
            }).response.then( (res) => {
                if (res.statusCode === 401) { // 401 means that we were denied by the user
                    throw new SAFEAuthError();
                } else {
                    return res.content;
                }
            }).then( (res) => {
                console.log(`writing ${JSON.stringify(res)} to file!!`);
                fs.writeFile(AUTH_FILE_NAME, JSON.stringify(res), (err) => {
                    console.error(`getAuth:: err=${err}`);
                    if (err) throw err;
                });
                return Promise.resolve(res);
            });
        return authResponse;

    });

    return authBlob;
}
