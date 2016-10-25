/// <reference path="../typings/index.d.ts" />

import * as fs from "fs";
import * as WebRequest from "web-request";
import { Request } from "web-request";

const endpoint : string = 'http://localhost:8100';

const directoryName : string = 'ethan-example2';

const authFileName : string = 'auth.dat';

// authorization payload
var payload = {
  "app": {
    "name": "Test Authentication payload",
    "id": "fee.fi.fo.fum",
    "version": "0.0.1",
    "vendor": "TuftsCrew"
  },
  "permissions": [
    "SAFE_DRIVE_ACCESS"
  ]
};

abstract class MaidSafeError {
    constructor() {
    }

    abstract show(): string;
    
    toString(): string {
        return `MaidSafeError::${this.show()}`;
    }
}
class SAFEAuthError extends MaidSafeError {
    constructor() { super(); }
    show() {
        return "SAFEAuthError";
    }
}
class SAFEDirCreationError extends MaidSafeError {
    constructor() { super(); }
    show() {
        return "SAFEDirCreationError";
    }
}

interface AuthResponse {
    token: string,
    permissions: Array<string>
};

async function getAuth() : Promise<AuthResponse> {

    const authBlob : Promise<AuthResponse> =
    new Promise<AuthResponse>( (resolve, reject) => {
        fs.readFile(authFileName, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data.toString()));
            }
        });
    }).catch( (err) => {

        console.log("failed to open file!!");

        // return
        const authResponse : Promise<AuthResponse> = 
            WebRequest.create<AuthResponse>(endpoint + '/auth', {
                json: true,
                method: "POST",
                body: payload
            }).response.then( (res) => {
                if (res.statusCode === 401) {
                    throw new SAFEAuthError();
                } else {
                    return res.content;
                }
            }).then( (res) => {
                console.log(`writing ${JSON.stringify(res)} to file!!`);
                fs.writeFile(authFileName, JSON.stringify(res), (err) => {
                    console.error(`getAuth:: err=${err}`);
                    if (err) throw err;
                });
                return Promise.resolve(res);
            });
        return authResponse;

    });

    return authBlob;
}

async function storeFile(authRes: AuthResponse, fileToSend: string): Promise<boolean> {
    console.log(`storeFile:: auth=${authRes} fileToSend=${fileToSend}`);

    // create directory is not idempotant... thanks Obama!
    let dirExists: boolean =
        await WebRequest.get(endpoint + `/nfs/directory/app/${directoryName}`, {
            method: "GET",
            auth: {
                bearer: authRes.token
            }
        }).then( (res) => {
            if (res.statusCode !== 200) {
                console.log(res.statusCode);
                return WebRequest.post(endpoint + `/nfs/directory/app/${directoryName}`, {
                        json: true,
                        method: "POST",
                        auth: {
                            bearer: authRes.token
                        },
                        body: {
                            "isPrivate": true
                        }
                    }).then( (res) => {
                        if (res.statusCode == 200) {
                            console.log("created directory!");
                            return Promise.resolve(true);
                        } else {
                            throw new SAFEDirCreationError();
                        }
                    });
            } else {
                // console.log("directory exists!!");
                // console.log(res.content);
                return Promise.resolve(true);
            }
        });

    if (!dirExists) {
        return Promise.resolve(false);
    }

    // let binaryContents : string = new Buffer(contents).toString('base64');
    let size : number = fs.statSync(fileToSend).size;
        // binaryContents.length;
    
    const mkFileReq : Request<{}> =
        await WebRequest.create(endpoint + `/nfs/file/app/${directoryName}/store.txt`, {
            json: true,
            method: "POST",
            encoding: null,
            auth: {
                bearer: authRes.token
            },
            headers: {
                'Content-Type': 'text',
                'Content-Length': size, // why is this in the client??
                'Metadata': new Buffer('sample metadata').toString('base64')
            }
        });
    fs.createReadStream(fileToSend).pipe(mkFileReq);

    const fileOk : boolean =
        await mkFileReq.response.then( (res) => {
            console.log(`storeFile:: statusCode=${res.statusCode}`);
            console.log(`storeFile:: content=${res.content}`);
            console.log(res);
            return Promise.resolve(res.statusCode === 200);
        }).catch( (err) => {
            console.error("file creation failed!!");
            // console.error(err);
            return Promise.resolve(false);
        });
    
    return Promise.resolve(fileOk);
}

async function loadFileContents(authRes : AuthResponse): Promise<string> {

    let fileResponse =
        await WebRequest.get(endpoint + `/nfs/file/app/${directoryName}/store.txt`, {
            method: "GET",
            encoding: null, // get us some binary data
            auth: {
                bearer: authRes.token
            }
        });
    console.log(`loadFileContents:: statusCode=${fileResponse.statusCode}`);
    console.log(`loadFileContents:: content=${fileResponse.content}`);

    return Promise.resolve(fileResponse.content.toString());
}

//
// Main
//

(async function() {
    const args = process.argv.slice(2);
    const auth : AuthResponse = await getAuth();
    if (args[0] === "store") {
        console.log("storing!");
        const itWorked = await storeFile(auth, args[1]);
        console.log(`[ ${itWorked ? 'PASSED' : 'FAILED'} ]`);
    } else if (args[0] === "load") {
        let contents : string = await loadFileContents(auth);
        console.log(`contents=${contents}`);
    }
})();
