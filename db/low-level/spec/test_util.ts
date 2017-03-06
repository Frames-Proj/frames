
const mkpath = require("mkpath");
import { SafeClient, AuthorizationPayload, AuthResponse, LeakResults,
         getLeakStatistics, ApiClientConfig } from "../index";
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

const endpoint: string = "http://localhost:8100";

// for generating a tmp file to use in caching
export function makeid() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 15; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

export function makeAlphaid() {
    let text = "";
    let possible = "abcdefghijklmnopqrstuvwxyz";

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

export function checkForLeakErrors(): void {
    const leakStats: LeakResults = getLeakStatistics();

    for (let [leakBlock, leaks] of leakStats) {
        for (let [handleClass, classLeaks] of leaks) {
            if (classLeaks.handlesLeaked > 0) {
                console.error("In leak block: " + leakBlock);
                console.error(`    ${classLeaks.handlesLeaked} handles leaked in handle`
                                + ` class ${handleClass}`);
                fail();
            }
        }
    }
}
