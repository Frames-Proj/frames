
import { TEST_DATA_DIR, failDone, makeid } from "./test-util";

import { Video, getVideo } from "../src/ts/video-model";

import Config from "../src/ts/global-config";
const CONFIG: Config = Config.getInstance();

import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP } from "safe-launcher-client";
import { safeClient } from "../src/ts/util";

describe("A frames Video model", () => {

    beforeEach(async (done) => {
        await safeClient.nfs.dir.create("app", CONFIG.SAFENET_VIDEO_DIR, false).catch(err => {
            if (err.res.statusCode === 400) {
                // the directory already exists! Yay!
                return;
            }
        });

        done();
    });

    it("can be created out of raw parts, and written to the network.", async (done) => {
        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        (await failDone(video.write(), done)).drop();

        video.drop();

        done();
    });

    fit("can be recovered from a serialized dataID.", async (done) => {
        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await withDropP(await failDone(video.write(), done), (dId: DataIDHandle) => {
                return failDone(dId.serialise(), done);
            });

        const recoveredVideo: Video =
            await withDropP(await failDone(safeClient.dataID.deserialise(dataId), done),
                            (dIdH: DataIDHandle) => {
                                return failDone(getVideo(dIdH), done);
            });

        /*
        expect(recoveredVideo.description).toBe(video.description);
        expect(recoveredVideo.file).toBe(video.file);
        expect(recoveredVideo.title).toBe(video.title);
        expect(recoveredVideo.owner).toBe(video.owner);
        expect(await recoveredVideo.getNumReplyVideos()).toBe(await video.getNumReplyVideos());
        expect(await recoveredVideo.getNumComments()).toBe(await video.getNumComments());

        video.drop();
        recoveredVideo.drop();
        */

        done();
    });

});


