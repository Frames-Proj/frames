
import { LeakResults, setCollectLeakStats, getLeakStatistics } from "safe-launcher-client";
import { makeRandAlphaStr, makeRandStr } from "../util";
import startupHook from "../startup-hooks";
import * as fs from "fs";
import { safeClient as sc } from "../util";
import Config from "../global-config";
const CONFIG = Config.getInstance();
import { Maybe } from "../maybe";

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

export async function setupTestEnv(): Promise<void> {
    await startupHook();
    setCollectLeakStats();
    await sc.dns.register("uwotm8")
        .catch(err => {
            const errDescription = JSON.parse(err.res.body.toString()).description;
            if (errDescription === "DnsError::DnsNameAlreadyRegistered") {
                return; // we good
            }
            throw err;
        })
        .then(() => CONFIG.setLongName(Maybe.just("uwotm8")));
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
