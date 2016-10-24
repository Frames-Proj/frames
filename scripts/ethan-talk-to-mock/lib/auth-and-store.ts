
import * as WebRequest from "web-request";

var endpoint = 'http://localhost:8100';

let directoryName : string = "ethan-example1";

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

async function storeFile(contents: string): Promise<boolean> {
    let size : number = contents.length;
    console.log(`storeFile:: contents=${contents}`);

    let authRes : AuthResponse =
        await WebRequest.create<AuthResponse>(endpoint + '/auth', {
            json: true,
            method: "POST",
            body: payload
        }).response.then( (res) => {
            if (res.statusCode === 401) {
                throw new SAFEAuthError();
            } else {
                return res.content;
            }
        });

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
                console.log("directory exists!!");
                console.log(res.content);
                return Promise.resolve(true);
            }
        });

    if (!dirExists) {
        return Promise.resolve(false);
    }

    let fileOk : boolean =
        await WebRequest.post(endpoint + `/nfs/file/app/${directoryName}/store.txt`, {
            json: true,
            method: "POST",
            encoding: null,
            auth: {
                bearer: authRes.token
            },
            headers: {
                'Content-Type': 'text',
                'Content-Length': size // why is this in the client??
                // 'Metadata': new Buffer('sample metadata').toString('base64')
            },
            body: new Buffer(contents).toString('base64')
        }).then( (res) => {
            console.log("wrote file!!");
            console.log(`statusCode=${res.statusCode}`);
            console.log(`content=${res.content}`);
            return Promise.resolve(res.statusCode === 200);
        });
    
    return Promise.resolve(fileOk);
}

async function loadFileContents(): Promise<string> {

    let authRes : AuthResponse =
        await WebRequest.create<AuthResponse>(endpoint + '/auth', {
            json: true,
            method: "POST",
            body: payload
        }).response.then( (res) => {
            if (res.statusCode === 401) {
                throw new SAFEAuthError();
            } else {
                return res.content;
            }
        });

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

    return Promise.resolve(fileResponse.content);
}



//
// Main
//

let args = process.argv.slice(2);
if (args[0] === "store") {
    storeFile(args[1]);
} else if (args[0] === "load") {
    let contents : Promise<string> = loadFileContents();
    contents.then( (cont) => {
        console.log(`contents=${cont}`);
    });
}
