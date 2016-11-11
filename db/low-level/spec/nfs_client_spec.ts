


/// <reference path="../typings/index.d.ts" />

import { makeid, client } from './test_util';
import { AuthorizationPayload } from '../src/ts/auth';
import { NfsClient, NfsDirectoryInfo } from '../src/ts/nfs';
// const mkpath = require('mkpath');



describe('An nfs client', () => {

    it('can check to see if a non-existant directory exists', (done) => {(async function() {
        const dirResponse : Promise<NfsDirectoryInfo> =
            client.nfs.dir.get('app', 'safe-client-test-bogus').catch((err) => {
                expect(err.res.statusCode).toBe(404);
                done();
            });

    })()});

    it('can make a new directory', (done) => {(async function() {
        const dirResponse : boolean =
            await client.nfs.dir.create('app', makeid(), true).catch((err) => {
                expect(err).toBeUndefined();
                return false;
            });
        expect(dirResponse).toBe(true);

        done();
    })()});

    it('can check to see if a freshly created directory exists', (done) => {(async function() {
        const dir : string = makeid();

        const createdDir : boolean =
            await client.nfs.dir.create('app', dir, true).catch((err) => {
                expect(err).toBeUndefined();
                return false;
            });
        expect(createdDir).toBe(true);
        const dirResponse : NfsDirectoryInfo = await client.nfs.dir.get('app', dir);

        expect(dirResponse.info.name).toBe(dir);
        expect(dirResponse.info.isPrivate).toBe(true);

        done();
    })()});

    it('can delete a directory', (done) => {(async function() {
        const dir : string = makeid();

        const createdDir : boolean =
            await client.nfs.dir.create('app', dir, true).catch((err) => {
                expect(err).toBeUndefined();
                return false;
            });
        expect(createdDir).toBe(true);

        const deletedDir : boolean =
            await client.nfs.dir.delete('app', dir).catch((err) => {
                expect(err).toBeUndefined();
                return false;
            });
        expect(deletedDir).toBe(true);

        client.nfs.dir.get('app', dir).catch((err) => {
            expect(err.res.statusCode).toBe(404);
            done();
        });

    })()});

    //
    // NfsFileClient
    //

    it('can upload a file to the network', (done) => { (async function() {
        const filename : string = makeid();

        const mkFile = await client.nfs.file.create('app', filename + '-invictus.txt',
                                                invictus, 'text/plain');
        expect(mkFile).toBe(true);
        done();

    })()});

    it('can get a file from the network', (done) => { (async function() {
        const filename : string = makeid();

        const mkFile = await client.nfs.file.create('app', filename + '-invictus.txt',
                                                invictus, 'text/plain');
        expect(mkFile).toBe(true);

        // const fileInfo = await client.nfs.file.get('app', filename + '-invictus.txt');


        done();
    })()});
    
});

const invictus : Buffer = Buffer.from(`
Out of the night that covers me,
Black as the pit from pole to pole,
I thank whatever gods may be
For my unconquerable soul.

In the fell clutch of circumstance
I have not winced nor cried aloud.
Under the bludgeoning of chance
My head is bloody, but unbowed.

Beyond this place of wrath and tears
Looms but the Horror of the shade,
And yet the menace of the years
Finds, and shall find me, unafraid.

It matters not how strait the gate,
How charged with punishments the scroll,
I am the master of my fate:
I am the captain of my soul.
`);
