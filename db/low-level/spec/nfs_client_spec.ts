


/// <reference path="../typings/index.d.ts" />

import { makeid, client, TEST_DATA_DIR } from './test_util';
import { AuthorizationPayload } from '../src/ts/auth';
import { NfsClient, NfsDirectoryInfo } from '../src/ts/nfs';
import * as stream from 'stream';
import * as fs from 'fs';


describe('An nfs directory client', () => {

    it('can check to see if a non-existant directory exists', (done) => {(async function() {
        const dirResponse : Promise<NfsDirectoryInfo> =
            client.nfs.dir.get('app', 'safe-client-test-bogus').catch((err) => {
                expect(err.res.statusCode).toBe(404);
                done();
            });

    })()});

    it('can make a new directory', (done) => {(async function() {
        await client.nfs.dir.create('app', makeid(), true).catch((err) => {
            fail(err);
            done();
        });

        done();
    })()});

    it('can check to see if a freshly created directory exists', (done) => {(async function() {
        const dir : string = makeid();

        await client.nfs.dir.create('app', dir, true).catch((err) => {
            fail(err);
            done();
        });

        const dirResponse : NfsDirectoryInfo = await client.nfs.dir.get('app', dir);

        expect(dirResponse.info.name).toBe(dir);
        expect(dirResponse.info.isPrivate).toBe(true);

        done();
    })()});

    it('can delete a directory', (done) => {(async function() {
        const dir : string = makeid();

        await client.nfs.dir.create('app', dir, true).catch((err) => {
            fail(err);
            done();
        });

        await client.nfs.dir.delete('app', dir).catch((err) => {
            fail(err);
            done();
        });

        client.nfs.dir.get('app', dir).catch((err) => {
            expect(err.res.statusCode).toBe(404);
            done();
        });

    })()});

    it('can update a directories name', (done) => {(async function() {
        const firstDirName : string = makeid();
        const secondDirName : string = makeid();

        await client.nfs.dir.create('app', firstDirName, true).catch((err) => {
            fail(err);
            done();
        });

        await client.nfs.dir.update('app', firstDirName, secondDirName).catch((err) => {
            fail(err);
            done();
        });

        const dirInfo : NfsDirectoryInfo = await client.nfs.dir.get('app', secondDirName);

        expect(dirInfo.info.name).toBe(secondDirName);

        done();

    })()});

    it('can move a directory', (done) => {(async function() {
        const firstDirName : string = makeid();
        const secondDirName : string = makeid();

        await client.nfs.dir.create('app', firstDirName, true).catch((err) => {
            fail(err);
            done();
        });

        console.log('about to move directory!');
        await client.nfs.dir.move('app', firstDirName, 'drive', secondDirName).catch((err) => {
            fail(err);
            done();
        });

        const dirInfo : NfsDirectoryInfo = await client.nfs.dir.get('drive', secondDirName);
        expect(dirInfo.info.name).toBe(secondDirName);

        done();

    })()});

});

describe("An nfs file client", () => {

    it('can upload a file to the network, and check that it is really there',
       (done) => { (async function()
    {
        const filename : string = makeid() + '-invictus.txt';

        let testStream : stream.Transform = new stream.PassThrough();

        await new Promise( (resolve, reject) => {
            testStream.write(invictus, (err) => {
                expect(err).toBeUndefined();
                resolve();
            });
        });

        const mkFile : Promise<void> =
            client.nfs.file.create('app', filename, testStream,
                                   invictus.byteLength, 'text/plain');

        await mkFile.catch( (err) => {
            fail(err);
            console.error(err);
            done();
        });

        const fileInfo = await client.nfs.file.get('app', filename);

        expect(fileInfo.body.equals(invictus)).toBe(true);

        done();

    })()});

    it('can handle image files as well as text blocks',
       (done) => {(async function()
    {
        const remotePath : string = makeid() + '-jesus.jpg';
        const localPath : string = TEST_DATA_DIR + '/jesus.jpg';

        let fileSize : number = fs.statSync(localPath).size;
        let testStream : stream.Readable = fs.createReadStream(localPath);

        const mkFile : Promise<void> =
            client.nfs.file.create('app', remotePath, testStream,
                                   fileSize, 'image/jpg');

        await mkFile.catch( (err) => {
            fail(err);
            done();
        });

        const fileInfo = await client.nfs.file.get('app', remotePath);

        // For some baffling reason, typescript wails when I annotate this with
        // the buffer type, but everything seems to work anyway. Please forgive the
        // typecasting.
        const imgBuffer : Buffer = <Buffer>await new Promise( (resolve, reject) => {
            const lpath : string = localPath; // typescript automatically caught this js closure bug #blessed
            fs.readFile(lpath, (err : NodeJS.ErrnoException, data : Buffer) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        expect(fileInfo.body.equals(imgBuffer)).toBe(true);

        done();

    })()});


});

// Buffer.from requires node --version to be >= 6.0.0
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
