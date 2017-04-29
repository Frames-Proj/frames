/*
 * File: src/ts/startup-hooks.ts
 *
 * Contains code which should run on app startup to hammer the
 * runtime environment into shape
 *
 */

import Config from "./global-config";
import { Maybe } from "./maybe";
import { NotFoundError } from "safe-launcher-client";
const CONFIG: Config = Config.getInstance();

import { safeClient } from "./util";

import * as mkpath from "mkpath";

// ensure that the service is registered and the home dir is created
async function checkServiceState(ln: Maybe<string>) {
    ln.caseOf({
        just: async (name: string) => {
            let services: string[];
            services = await safeClient.dns.getServices(name);

            if (services.indexOf(CONFIG.SERVICE_NAME) === -1) {
                try {
                    await safeClient.nfs.dir.get("app", CONFIG.SERVICE_HOME_DIR);
                } catch (e) {
                    if (e instanceof NotFoundError) {
                        await safeClient.nfs.dir.create("app", CONFIG.SERVICE_HOME_DIR, true);
                    } else {
                        throw e;
                    }
                }

                await safeClient.dns.addService(name, CONFIG.SERVICE_NAME, "app", CONFIG.SERVICE_HOME_DIR);
            }
        },
        nothing: async () => {}
    });
};

export default async function startupHook(): Promise<void> {
    await ensureVideoCache();
    await ensureThumbnailCache();

    await ensureSafeVideoDir();
    await ensureSafeThumbnailDir();

    checkServiceState(CONFIG.getLongName());
    CONFIG.addLongNameChangeListener(checkServiceState);
}

//
// Ensure the right environment on the local box
//

function ensureVideoCache(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        mkpath(CONFIG.APP_VIDEO_DIR, 755, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function ensureThumbnailCache(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        mkpath(CONFIG.APP_THUMBNAIL_DIR, 755, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}



//
// Ensure the right environment on the SafeNET
//

function ensureSafeVideoDir(): Promise<void> {
    return safeClient.nfs.dir.create("app", CONFIG.SAFENET_VIDEO_DIR, false).catch(err => {
        if (err.res.statusCode === 400) {
            // the directory already exists! Yay!
            return;
        }
    });
}

function ensureSafeThumbnailDir(): Promise<void> {
    return safeClient.nfs.dir.create("app", CONFIG.SAFENET_THUMBNAIL_DIR, false)
        .catch(err => { if (err.res.statusCode === 400) return; });
}

