/*
 * File: src/ts/startup-hooks.ts
 *
 * Contains code which should run on app startup to hammer the
 * runtime environment into shape
 *
 */

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

import { safeClient } from "./util";

import * as mkpath from "mkpath";

export default async function startupHook(): Promise<void> {
    await ensureVideoCache();
    await ensureSafeVideoDir();
}

function ensureVideoCache(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        mkpath(CONFIG.APP_VIDEO_DIR, 755, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function ensureSafeVideoDir(): Promise<void> {
    return safeClient.nfs.dir.create("app", CONFIG.SAFENET_VIDEO_DIR, false).catch(err => {
        if (err.res.statusCode === 400) {
            // the directory already exists! Yay!
            return;
        }
    });
}

