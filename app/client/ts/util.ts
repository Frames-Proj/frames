
import * as fs from "fs";

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

import { SafeClient } from "safe-launcher-client";

export type ValidationState = "error" | "success" | "warning";

export class NoUserNameError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export const safeClient: SafeClient =
    new SafeClient(CONFIG.makeAuthPayload(), CONFIG.SAFE_LAUNCHER_ENDPOINT);

export const WATCH_URL_RE: RegExp = /\/watch\/([a-zA-Z0-9\/\+]+)/;

// TODO: does not handle international characters
export const VIDEO_TITLE_RE: RegExp = /^[A-Za-z0-9 ]+$/;

export async function fileExists(path: string): Promise<boolean> {
    return new Promise<boolean>( (resolve, reject) => {
        fs.stat(path, (err, stat) => {

            if (err == null) {
                resolve(true);
            } else if (err.code === "ENOENT") {
                resolve(false);
            } else {
                reject(err);
            }

        });
    });
}

function buildString(possibleChars: string, finalLength: number) {
    let text = "";
    for (let i = 0; i < finalLength; i++) {
        text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }
    return text;
}

export function makeRandStr() {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    return buildString(possible, 15);
}

export function makeRandAlphaStr() {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    return buildString(possible, 15);
}
