
/// <reference path="../typings/index.d.ts" />

import { AuthorizationPayload } from '../src/ts/auth';
import { SafeClient } from '../index';
import { makeid, testAuthPayload, endpoint, cacheFile } from './test_util';
const mkpath = require('mkpath');


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
    
    it('Does not need to authenticate a second time (you should not have to click twice)', (done) => {
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
