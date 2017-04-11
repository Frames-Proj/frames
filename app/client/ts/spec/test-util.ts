
import { LeakResults, getLeakStatistics } from "safe-launcher-client";

export const TEST_DATA_DIR: string = `${__dirname}/../../../../../test-data`;

export function failDone<T>(promise: Promise<T>,
                            done: () => void): Promise<T> {
    return promise.catch((err) => {
        console.error(JSON.stringify(err));
        fail(err); done(); throw err;
    });
}

function buildString(possibleChars: string, finalLength: number) {
    let text = "";
    for (let i = 0; i < finalLength; i++) {
        text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }
    return text;
}

export function makeid() {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    return buildString(possible, 15);
}

export function makeAlphaid() {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    return buildString(possible, 15);
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
