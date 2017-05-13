
import { TEST_DATA_DIR, failDone,
         makeid, checkForLeakErrors, setupTestEnv } from "./test-util";

import Playlist from "../playlist-model";
import Video from "../video-model";
import { Maybe } from "../maybe";

import Config from "../global-config";
const CONFIG: Config = Config.getInstance();

import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle,
         setCollectLeakStats, setCollectLeakStatsBlock
       } from "safe-launcher-client";
import { safeClient } from "../util";
const sc = safeClient;

import startupHook from "../startup-hooks";

describe("A playlist model", () => {

    beforeAll(async (done) => {
        await failDone(setupTestEnv(), done);
        done();
    });

    afterAll(() => {
        checkForLeakErrors();
    });

    it("can be freshly created.", async (done) => {
        setCollectLeakStatsBlock("pms:test1 create new playlist");

        const playlist = await failDone(Playlist.new("Cats " + makeid(), "A list of cat videos"), done);
        await failDone(playlist.drop(), done);
        done();
    });

    it("can be read from an XorName", async (done) => {
        setCollectLeakStatsBlock("pms:test2 round trip");

        const playlist = await failDone(Playlist.new("Cats " + makeid(), "A list of cat videos"), done);
        const xorName: SerializedDataID =
            await failDone(withDropP(await playlist.xorName(), di => di.serialise()), done);

        const playlist2: Playlist =
            await failDone(withDropP(await sc.dataID.deserialise(xorName), di => Playlist.read(di)), done);

        expect(playlist.title).toBe(playlist2.title);
        expect(playlist.description).toBe(playlist2.description);
        expect(playlist.owner).toBe(playlist2.owner);

        await failDone(playlist.drop(), done);
        await failDone(playlist2.drop(), done);
        done();
    });

    it("can get a video appended", async (done) => {
        setCollectLeakStatsBlock("pms:test3 append");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        const playlist = await failDone(Playlist.new("Cats " + makeid(), "A list of cat videos"), done);

        await failDone(playlist.append(video), done);
        await failDone(playlist.append(video), done);

        await failDone(video.drop(), done);
        await failDone(playlist.drop(), done);
        done();
    });

    it("can be serialized with videos in the list", async (done) => {
        setCollectLeakStatsBlock("pms:test4 append round trip");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        const playlist = await failDone(Playlist.new("Cats " + makeid(), "A list of cat videos"), done);

        await failDone(playlist.append(video), done);
        await failDone(playlist.append(video), done);

        const xorName: SerializedDataID =
            await failDone(withDropP(await playlist.xorName(), di => di.serialise()), done);

        const playlist2: Playlist =
            await failDone(withDropP(await sc.dataID.deserialise(xorName), di => Playlist.read(di)), done);

        const video2: Video = playlist2.videos[0];
        expect(video.title).toBe(video2.title);
        expect(video.description).toBe(video2.description);
        expect(video.owner).toBe(video2.owner);

        expect(playlist.title).toBe(playlist2.title);
        expect(playlist.description).toBe(playlist2.description);
        expect(playlist.owner).toBe(playlist2.owner);

        await playlist2.videos.forEach(async v => await v.drop());
        await failDone(playlist2.drop(), done);
        await failDone(video.drop(), done);
        await failDone(playlist.drop(), done);
        done();
    });

});
