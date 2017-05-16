import { TEST_DATA_DIR, failDone, makeid,
         checkForLeakErrors, setupTestEnv } from "./test-util";
import { VideoFactory, CachedVideoInfoStringy } from "../video-cache";
import Video from "../video-model";
import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle,
         setCollectLeakStats, setCollectLeakStatsBlock
       } from "safe-launcher-client";
import { Maybe } from "../maybe";

import { safeClient as sc } from "../util";
import Config from "../global-config";
const CONFIG = Config.getInstance();

import * as fs from "fs";

describe("A Video factory", () => {

    beforeAll(async (done) => {
        await failDone(setupTestEnv(), done);
        done();
    });

    it("can be created", async done => {
        const vf: VideoFactory = await VideoFactory.getInstance();
        done();
    });

    fit("can compact the video cache", async done => {
        const vf: VideoFactory = await VideoFactory.getInstance();
        const testDirName = `/tmp/frames-test/${makeid()}`;

        // create a garbage value to use to test the cache compaction logic
        // mostly here for fast iteration during development
        let i: number = 0;
        function mkTestVid(): CachedVideoInfoStringy {
            return {
                xorName: makeid(),
                payload: undefined,
                file: `${testDirName}/${makeid()}`,
                thumbnailFile: `${testDirName}/${makeid()}`,
                timestamp: ++i
            };
        }

        async function idempotentMkdirSync(name): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                fs.mkdir(name, (err) => {
                    if (err && err.code === "EEXIST") resolve();
                    else if (err) reject();
                    else resolve();
                });
            });
        }
        idempotentMkdirSync("/tmp/frames-test");
        fs.mkdirSync(testDirName);
        for (let i = 0; i < CONFIG.MAX_CACHE_SIZE + 2; ++i) {
            const v = mkTestVid();
            fs.closeSync(fs.openSync(v.file, "w")); // make empty file
            fs.closeSync(fs.openSync(v.thumbnailFile, "w"));
            await vf._addVideo(Promise.resolve(Maybe.just(v)));
        }

        // TODO: remove test dir
        // fs.rmdirSync(testDirName);

        // expect there to be CONFIG.MAX_CACHE_SIZE * 2 / 2 video in the directory
        // there are 2 files per video, and we should just have cut the number of files
        // on disk in half
        expect(fs.readdirSync(testDirName).length).toBe(CONFIG.MAX_CACHE_SIZE);

        done();
    });

});
