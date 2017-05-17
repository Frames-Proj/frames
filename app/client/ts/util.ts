
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

export async function recursiveRmdir(dir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                reject(err);
            } else {
                Promise.all(files.map(f => {
                    const fullPath: string = `${dir}/${f}`;
                    return new Promise((resInner, rejInner) => {
                        fs.stat(fullPath, (err, stats: fs.Stats) => {
                            if (err) {
                                reject(err);
                            } else {
                                if (stats.isDirectory()) {
                                    recursiveRmdir(fullPath).then(_ => resInner());
                                } else {
                                    fs.unlink(fullPath, err => {
                                        if (err) rejInner(err);
                                        else resInner();
                                    });
                                }
                            }
                        });
                    });
                })).then(_ => {
                    fs.rmdir(dir, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        });
    });
}

