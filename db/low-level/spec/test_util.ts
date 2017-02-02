
const mkpath = require("mkpath");
import { AuthorizationPayload, AuthResponse } from "../src/ts/auth";
import { SafeClient } from "../index";
import { ApiClientConfig } from "../src/ts/client";
import * as stream from "stream";

const testAuthPayload: AuthorizationPayload = {
    "app": {
        "name": "Safe Client Test",
        "id": "fee.fi.fo.fum",
        "version": "0.0.1",
        "vendor": "SafeClient"
    },
    "permissions": [
        "SAFE_DRIVE_ACCESS",
        "LOW_LEVEL_API"
    ]
};

const endpoint : string = "http://localhost:8100";

// for generating a tmp file to use in caching
export function makeid() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 15; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

export const client: SafeClient = new SafeClient(testAuthPayload, endpoint);

export const TEST_DATA_DIR: string = `${__dirname}/../../spec/test_data`;

// really javascript?
export function exists<T>(list: T[], pred: (elem: T) => boolean): boolean {
    for (let e of list) {
        if (pred(e)) return true;
    }
    return false;
}

export function failDone<T>(promise: Promise<T>,
                            done: () => void): Promise<T> {
    return promise.catch((err) => {
        console.error(JSON.stringify(err));
        fail(err); done(); throw err;
    });
}
