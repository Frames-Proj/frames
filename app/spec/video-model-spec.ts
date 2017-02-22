
import { TEST_DATA_DIR, failDone, makeid } from "./test-util";

import { Video, getVideo } from "../src/ts/video-model";

import Config from "../src/ts/global-config";
const CONFIG: Config = Config.getInstance();

import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle
       } from "safe-launcher-client";
import { safeClient } from "../src/ts/util";

import startupHook from "../src/ts/startup-hooks";

let started: boolean = false;

describe("A frames Video model", () => {

    beforeEach(async (done) => {
        if (!started) {
            await startupHook();
            started = true;
        }
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

    it("can be recovered from a serialized dataID.", async (done) => {
        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await failDone(withDropP(await video.write(), (dId: DataIDHandle) => {
                return dId.serialise();
            }), done);

        const recoveredVideo: Video =
            await failDone(withDropP(await safeClient.dataID.deserialise(dataId), (dIdH: DataIDHandle) => {
                return getVideo(dIdH);
            }), done);

        expect(recoveredVideo.title).toBe(video.title);
        expect(recoveredVideo.description).toBe(video.description);

        await failDone(video.drop(), done);
        await failDone(recoveredVideo.drop(), done);

        done();
    });

});


