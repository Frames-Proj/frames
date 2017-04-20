
import { LeakResults, getLeakStatistics } from "safe-launcher-client";
import { makeRandAlphaStr, makeRandStr } from "../util";
import * as fs from "fs";

export const TEST_DATA_DIR: string = `${__dirname}/../../client/ts/spec/test-data`;

export function failDone<T>(promise: Promise<T>,
                            done: () => void): Promise<T> {
    return promise.catch((err) => {
        console.error(JSON.stringify(err));
        fail(err); done(); throw err;
    });
}

export const makeid = makeRandStr;
export const makeAlphaid = makeRandAlphaStr;

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

export async function diffFiles(f1: string, f2: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.readFile(f1, (err, b1) => {
            if (err) {
                reject(err);
            } else {
                fs.readFile(f2, (err, b2) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(b1.equals(b2));
                    }
                });
            }
        });
    });
}

export function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
}
