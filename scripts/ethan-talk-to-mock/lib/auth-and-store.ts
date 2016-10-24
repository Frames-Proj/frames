
import * as WebRequest from "web-request";

var endpoint = 'http://localhost:8100';

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

async function storeFile(contents: string): Promise<{}> {
    // let auth : Promise<AuthResponse> =

    let size : number = contents.length;

    console.log("PING!!")

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
    await WebRequest.get(endpoint + '/nfs/directory/app/ethan-example')
        .then( (res) => {
            if (res.statusCode !== 200) {
                return WebRequest.post(endpoint + '/nfs/directory/app/ethan-example1', {
                        json: true,
                        method: "POST",
                        auth: {
                            bearer: authRes.token
                        },
                        body: {
                            "isPrivate": true
                        }
                    }).then( (res) => {
                        console.log("PANG");
                        if (res.statusCode == 200) {
                            console.log("created directory!");
                        } else {
                            throw new SAFEDirCreationError();
                        }
                    });
            }
        });
    /*
    await WebRequest.post(endpoint + '/nfs/directory/app/ethan-example1', {
            json: true,
            method: "POST",
            auth: {
                bearer: authRes.token
            },
            body: {
                "isPrivate": true
            }
        }).then( (res) => {
            console.log("PANG");
            if (res.statusCode == 200) {
                console.log("created directory!");
            } else {
                throw new SAFEDirCreationError();
            }
        });
        */

    await WebRequest.post(endpoint + '/nfs/directory/app/ethan-example/store.txt', {
            json: true,
            method: "POST",
            auth: {
                bearer: authRes.token
            },
            headers: {
                'Content-Type': 'text',
                'Content-Length': size // why is this in the client??
                // 'Metadata': new Buffer('sample metadata').toString('base64')
            },
            body: {
                contents
            }
        });
    
    return Promise.resolve({});
}

function loadFileContents(): string {
    return "unimplimented";
}



//
// Main
//

let args = process.argv.slice(2);
if (args[0] === "store") {
    storeFile(args[1]);
} else {
    let contents = loadFileContents();
    console.log("contents");
}
