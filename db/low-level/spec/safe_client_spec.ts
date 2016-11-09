
/// <reference path="../typings/index.d.ts" />

import { AuthorizationPayload } from '../src/ts/auth';
import { SafeClient } from '../index';
const mkpath = require('mkpath');

// const foo : FooBar = { "baz": "hi" }

const testAuthPayload : AuthorizationPayload = {
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

const endpoint : string = 'http://localhost:8100';

// for generating a tmp file to use in caching
function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

const cacheFile : Promise<string> =
            new Promise( (resolve, reject) => {
                mkpath('/tmp/safe-client-test',  function(err) {
                        if (err) reject(err);
                        else resolve();
                    });
            }).then( ok => {
                return '/tmp/safe-client-test/' + makeid() + '.dat';
            });

describe('A SafeClient is an object which can make calls to the safe_laucher', () => {

    // smoke test
    it('Can authenticate with the safe_launcher', (done) => {
        (async function() {

            const client : SafeClient =
                new SafeClient(testAuthPayload, endpoint, await cacheFile);

            client.authResponse.catch( (err) => {
                console.log(err);
            })

            expect(await client.authenticated()).toBe(true);

            done();
        })();
    });

});
