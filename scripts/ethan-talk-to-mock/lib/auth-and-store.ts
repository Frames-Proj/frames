/// <reference path="../typings/index.d.ts" />

// We use the nodejs fs module to read files and stream them to
// the network
import * as fs from "fs";
// WebRequests is a thin wrapper around js's flagship requests library.
// It adds types and promises in a very non-invasive way.
import * as WebRequest from "web-request";
import { Request } from "web-request";


// polyfill because, really, no assert function?
function assert(condition : boolean, message ?: string ) : void {
    if (!condition) {
        console.error(message || "Assertion failed");
        process.exit(1);
        // never returns in this case
    }
}

// the port I have a safe_launcher running on
const endpoint : string = 'http://localhost:8100';
// the directory we are going to place a file under
const directoryName : string = 'ethan-example';
// the filename to use for caching the authorization tokens
const authFileName : string = 'auth.dat';

// this was copy-pasted from the tutorial. I did twiddle a few values, but
// they definitly did not cause problems.
var authPayload = {
  "app": {
    "name": "Test App",
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
    show() {return "SAFEAuthError";}
}
class SAFEDirCreationError extends MaidSafeError {
    constructor() { super(); }
    show() {return "SAFEDirCreationError";}
}

// TypeScript lets us define interfaces to impose a notion of
// static typing on JSON objects. In this case the authorization
// api happens to return a response which looks like this.
interface AuthResponse {
    token: string,
    permissions: Array<string>
};

// sometimes you just want to know if the side effects went through
// successfully
function filterFailures(p: Promise<boolean>): Promise<boolean> {
    return p.catch( (err) => {
        return Promise.resolve(false);
    });
}

// This function impliments authorization caching. It just stores
// the app auth token in the clear in a file called auth.dat
async function getAuth() : Promise<AuthResponse> {

    // first we try to see if the authorization token is already here
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
        // if the auth file does not exist, we ask the safe_launcher
        // for a token.
        console.log("failed to open file!!");

        const authResponse : Promise<AuthResponse> = 
            WebRequest.create<AuthResponse>(endpoint + '/auth', {
                json: true,
                method: "POST",
                body: authPayload
            }).response.then( (res) => {
                if (res.statusCode === 401) { // 401 mean that we were denied by the user
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
                // if the directory does not exist we can't get any information
                // about it
                console.log(`storeFile::making direcotory statusCode=${res.statusCode}`);
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
                return Promise.resolve(true);
            }
        });
    assert(dirExists);

    if (!dirExists) {
        return Promise.resolve(false);
    }

    // If the file exists, delete it.
    let ensureFileSlotExists : boolean = await filterFailures(
        WebRequest.delete(endpoint + `/nfs/file/app/${directoryName}/store.txt`, {
            method: "DELETE",
            auth: {
                bearer: authRes.token
            }
        }).then( (res) => {
            console.log(`storeFile::deleting old file statusCode=${res.statusCode}`);
            // we succeed if the file was successfully deleted, or it never existed
            // in the first place.
            return Promise.resolve(res.statusCode === 200 || res.statusCode === 404);
        }));

    assert(ensureFileSlotExists);

    let size : number = fs.statSync(fileToSend).size;
    
    // This sets up all the headers and whatnot for the request.
    const mkFileReq : Request<{}> =
        // note that this gives us a Request<T> instead of a Response<T> like
        // the calls to WebRequest.post and whatnot
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
    // This attaches an fs pipe to the request, so we will squirt the
    // file onto the network
    fs.createReadStream(fileToSend).pipe(mkFileReq);

    // It is only here where we actually send the request.
    const fileOk : boolean = await filterFailures(
        mkFileReq.response.then( (res) => {
            console.log(`storeFile:: statusCode=${res.statusCode}`);
            console.log(`storeFile:: content=${res.content}`);
            return Promise.resolve(res.statusCode === 200);
        }));
    
    return Promise.resolve(fileOk);
}

async function loadFileContents(authRes : AuthResponse): Promise<string> {

    // just a get request
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

// This is just wrapped in a self-executing async function because I want
// that sweet sweet async/await sugar.
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
