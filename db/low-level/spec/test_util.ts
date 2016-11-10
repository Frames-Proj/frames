
/// <reference path="../typings/index.d.ts" />

const mkpath = require('mkpath');
import { AuthorizationPayload, AuthResponse,
         getCachedTokenOrAuthenticate } from '../src/ts/auth';
import { ApiClientConfig } from '../src/ts/client';



export const testAuthPayload : AuthorizationPayload = {
    "app": {
        "name": "Safe Client Test",
        "id": "fee.fi.fo.fum",
        "version": "0.0.1",
        "vendor": "SafeClient"
    },
    "permissions": [
        "SAFE_DRIVE_ACCESS"
    ]
};

export const endpoint : string = 'http://localhost:8100';

// for generating a tmp file to use in caching
export function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


export const cacheFile : Promise<string> =
    new Promise( (resolve, reject) => {
        mkpath('/tmp/safe-client-test',  function(err) {
                if (err) reject(err);
                else resolve();
            });
    }).then( ok => {
        return '/tmp/safe-client-test/' + makeid() + '.dat';
    });

export const testClientConfig : Promise<ApiClientConfig> =
    (async function() : Promise<ApiClientConfig> {
        return {
            authRes: getCachedTokenOrAuthenticate(testAuthPayload, endpoint, false, await cacheFile),
            endpoint: endpoint
        }
    })();
