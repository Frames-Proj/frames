import { TEST_DATA_DIR, failDone, makeid,
         checkForLeakErrors, setupTestEnv, idempotentMkdirSync } from "./test-util";
import { VideoFactory, CachedVideoInfoStringy } from "../video-cache";
import Video from "../video-model";
import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle,
         setCollectLeakStats, setCollectLeakStatsBlock
       } from "safe-launcher-client";
import { Maybe } from "../maybe";

import { safeClient as sc, recursiveRmdir } from "../util";
import Config from "../global-config";
const CONFIG = Config.getInstance();

import * as fs from "fs";

describe("A Video factory", () => {

    beforeAll(async (done) => {
        await failDone(setupTestEnv(), done);
        done();
    });

    it("can be created", async done => {
        setCollectLeakStatsBlock("vcs:test1 create");
        const vf: VideoFactory = await VideoFactory.getInstance();
        done();
    });

    it("can compact the video cache", async done => {
        setCollectLeakStatsBlock("vcs:test2 compact");
        // should this be in a separate standup hook?
        const tmpMfFile: string = CONFIG.APP_HOME_DIR + "/mf.test.tmp";
        if (fs.existsSync(CONFIG.CACHE_MANIFEST_FILE))
            fs.renameSync(CONFIG.CACHE_MANIFEST_FILE, tmpMfFile);

        const vf: VideoFactory = await VideoFactory.getInstance();
        const testDirName = `${CONFIG.APP_HOME_DIR}/frames-test/${makeid()}`;
        idempotentMkdirSync(`${CONFIG.APP_HOME_DIR}`);
        idempotentMkdirSync(`${CONFIG.APP_HOME_DIR}/frames-test`);

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

        fs.mkdirSync(testDirName);
        for (let i = 0; i < CONFIG.MAX_CACHE_SIZE + 2; ++i) {
            const v = mkTestVid();
            fs.closeSync(fs.openSync(v.file, "w")); // make empty file
            fs.closeSync(fs.openSync(v.thumbnailFile, "w"));
            await failDone(vf._addVideo(Promise.resolve(Maybe.just(v))), done);
        }

        // expect there to be CONFIG.MAX_CACHE_SIZE * 2 / 2 video in the directory
        // there are 2 files per video, and we should just have cut the number of files
        // on disk in half
        expect(fs.readdirSync(testDirName).length).toBe(CONFIG.MAX_CACHE_SIZE);
        await failDone(recursiveRmdir(testDirName), done);

        if (fs.existsSync(tmpMfFile))
            fs.renameSync(tmpMfFile, CONFIG.CACHE_MANIFEST_FILE);
        done();
    });

    it("can return a cached video.", async (done) => {
        setCollectLeakStatsBlock("vcs:test3 recover");
        const vf: VideoFactory = await VideoFactory.getInstance();

        const video: Video =
            await failDone(vf.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await failDone(withDropP(await video.xorName(), (dId: DataIDHandle) => {
                return dId.serialise();
            }), done);

        const recoveredVideo1: Video =
            await failDone(withDropP(await sc.dataID.deserialise(dataId), (dIdH) => {
                return vf.read(dIdH);
            }), done);

        expect(recoveredVideo1.title).toBe(video.title);
        expect(recoveredVideo1.description).toBe(video.description);

        await failDone(video.drop(), done);

        const recoveredVideo2: Video =
            await failDone(withDropP(await sc.dataID.deserialise(dataId), (dIdH) => {
                return vf.read(dIdH);
            }), done);

        expect(recoveredVideo1.title).toBe(recoveredVideo2.title);
        expect(recoveredVideo1.description).toBe(recoveredVideo2.description);

        expect(await recoveredVideo1.file.valueOr("BOGUS1"))
            .toBe(await recoveredVideo2.file.valueOr("BOGUS2"));
        expect(await recoveredVideo1.thumbnailFile)
            .toBe(await recoveredVideo2.thumbnailFile);

        await failDone(recoveredVideo1.drop(), done);
        await failDone(recoveredVideo2.drop(), done);

        done();
    });

});
