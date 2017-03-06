
import { TEST_DATA_DIR, failDone, makeid } from "./test-util";

import VideoComment from "../comment-model";
import Video from "../video-model";

import Config from "../global-config";
const CONFIG: Config = Config.getInstance();

import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle
       } from "safe-launcher-client";
import { safeClient } from "../util";
const sc = safeClient;

import startupHook from "../startup-hooks";
let started: boolean = false;

describe("A video comment model", () => {

    it("can be created as a root comment", async (done) => {
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
        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const comment: VideoComment =
            await video.addComment("Some comment text.");

        const xorName: SerializedDataID =
            await failDone(withDropP(await comment.xorName, n => n.serialise()), done);

        const deserialComment: VideoComment =
            await failDone(withDropP(
                await sc.dataID.deserialise(xorName), d => VideoComment.read(d)), done);

        expect(deserialComment.text).toBe(comment.text);
        expect(deserialComment.date).toBe(comment.date);
        expect(deserialComment.parentVersion).toBe(comment.parentVersion);
        expect((await deserialComment.parent.serialise())
               .equals(await comment.parent.serialise())).toBe(true);

        await video.drop();
        await comment.drop();
        await deserialComment.drop();

        done();
    });

    it("can be created as a comment reply", async (done) => {
        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const rootComment: VideoComment =
            await video.addComment("Deflate-gate was a hoax.");

        const comment: VideoComment =
            await rootComment.addComment("You lie!");

        const xorName: SerializedDataID =
            await failDone(withDropP(await comment.xorName, n => n.serialise()), done);

        const deserialComment: VideoComment =
            await failDone(withDropP(
                await sc.dataID.deserialise(xorName), d => VideoComment.read(d)), done);

        expect(deserialComment.text).toBe(comment.text);
        expect(deserialComment.date).toBe(comment.date);
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

