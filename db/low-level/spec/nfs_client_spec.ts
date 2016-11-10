


/// <reference path="../typings/index.d.ts" />

import { testClientConfig, makeid } from './test_util';
import { AuthorizationPayload } from '../src/ts/auth';
import { NfsClient, NfsDirectoryInfo } from '../src/ts/nfs';
// const mkpath = require('mkpath');



describe('An nfs client', () => {

    it('can check to see if a non-existant directory exists', (done) => {

        (async function() {
            const client : NfsClient = new NfsClient(await testClientConfig);

            const dirResponse : Promise<NfsDirectoryInfo> =
                client.dir.getDirectory('app', 'safe-client-test-bogus').catch((err) => {
                    expect(err.res.statusCode).toBe(404);
                    done();
                });

        })();
    });

    it('can make a new directory', (done) => {

        (async function() {
            const client : NfsClient = new NfsClient(await testClientConfig);

            const dirResponse : boolean =
                await client.dir.createDirectory('app', makeid(), true).catch((err) => {
                    expect(err).toBeUndefined();
                    return false;
                });
            expect(dirResponse).toBe(true);

            done();
        })();
    });

    it('can check to see if a freshly created directory exists', (done) => {

        (async function() {
            const client : NfsClient = new NfsClient(await testClientConfig);
            const dir : string = makeid();

            const createdDir : boolean =
                await client.dir.createDirectory('app', dir, true).catch((err) => {
                    expect(err).toBeUndefined();
                    return false;
                });
            expect(createdDir).toBe(true);
            const dirResponse : NfsDirectoryInfo = await client.dir.getDirectory('app', dir);

            expect(dirResponse.info.name).toBe(dir);
            expect(dirResponse.info.isPrivate).toBe(true);

            done();
        })();
    });

});
