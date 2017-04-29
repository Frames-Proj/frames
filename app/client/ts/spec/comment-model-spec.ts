
import { TEST_DATA_DIR, failDone, makeid, checkForLeakErrors } from "./test-util";

import VideoComment from "../comment-model";
import { Video } from "../video-model";
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
let started: boolean = false;

describe("A video comment model", () => {

    beforeAll(async (done) => {
        await failDone(startupHook(), done);
        setCollectLeakStats();
        CONFIG.setLongName(Maybe.just("uwotm8"));
        done();
    });

    afterAll(() => {
        checkForLeakErrors();
    });

    it("can be created as a root comment", async (done) => {
        setCollectLeakStatsBlock("cms:test1 create root");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const comment: VideoComment =
            await video.addComment("Some comment text.");

        await video.drop();
        await comment.drop();

        done();
    });

    it("can be created as a comment reply", async (done) => {
        setCollectLeakStatsBlock("cms:test2 create reply");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const rootComment: VideoComment =
            await video.addComment("Deflate-gate was a hoax.");

        const replyComment: VideoComment =
            await rootComment.addComment("You lie!");

        await video.drop();
        await rootComment.drop();
        await replyComment.drop();

        done();
    });

    it("can be saved and recovered when it is a top level comment", async (done) => {
        setCollectLeakStatsBlock("cms:test3 save recover top");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const comment: VideoComment =
            await video.addComment("Some comment text.");

        const xorName: SerializedDataID =
            await failDone(withDropP(await comment.xorName(), n => n.serialise()), done);

        const deserialComment: VideoComment =
            await failDone(withDropP(
                await sc.dataID.deserialise(xorName), d => VideoComment.read(d)), done);

        expect(deserialComment.text).toBe(comment.text);
        expect(deserialComment.date.getTime()).toBe(comment.date.getTime());
        expect(deserialComment.parentVersion).toBe(comment.parentVersion);
        expect((await deserialComment.parent.serialise())
               .equals(await comment.parent.serialise())).toBe(true);

        await video.drop();
        await comment.drop();
        await deserialComment.drop();

        done();
    });

    it("can be created as a comment reply", async (done) => {
        setCollectLeakStatsBlock("cms:test4 reply");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const rootComment: VideoComment =
            await video.addComment("Deflate-gate was a hoax.");

        const comment: VideoComment =
            await rootComment.addComment("You lie!");

        const xorName: SerializedDataID =
            await failDone(withDropP(await comment.xorName(), n => n.serialise()), done);

        const deserialComment: VideoComment =
            await failDone(withDropP(
                await sc.dataID.deserialise(xorName), d => VideoComment.read(d)), done);

        expect(deserialComment.text).toBe(comment.text);
        expect(deserialComment.date.getTime()).toBe(comment.date.getTime());
        expect(deserialComment.parentVersion).toBe(comment.parentVersion);
        expect((await deserialComment.parent.serialise())
               .equals(await comment.parent.serialise())).toBe(true);

        await video.drop();
        await rootComment.drop();
        await comment.drop();
        await deserialComment.drop();

        done();
    });



});

