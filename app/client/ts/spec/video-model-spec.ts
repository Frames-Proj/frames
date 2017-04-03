
import { TEST_DATA_DIR, failDone, makeid, checkForLeakErrors } from "./test-util";

import Video from "../video-model";

import Config from "../global-config";
const CONFIG: Config = Config.getInstance();

import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle,
         setCollectLeakStats, setCollectLeakStatsBlock
       } from "safe-launcher-client";
import { safeClient } from "../util";

import startupHook from "../startup-hooks";

describe("A frames Video model", () => {

    beforeAll(async (done) => {
        await failDone(startupHook(), done);
        setCollectLeakStats();
        done();
    });

    afterAll(() => {
        checkForLeakErrors();
    });

    it("can be created out of raw parts, and written to the network.", async (done) => {
        setCollectLeakStatsBlock("vms:test1 create raw write");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        await video.drop();

        done();
    });

    it("can be recovered from a serialized dataID.", async (done) => {
        setCollectLeakStatsBlock("vms:test2 recover");

        const video: Video =
            await failDone(Video.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await failDone(withDropP(await video.xorName(), (dId: DataIDHandle) => {
                return dId.serialise();
            }), done);

        const recoveredVideo: Video =
            await failDone(withDropP(await safeClient.dataID.deserialise(dataId), (dIdH) => {
                return Video.read(dIdH);
            }), done);

        expect(recoveredVideo.title).toBe(video.title);
        expect(recoveredVideo.description).toBe(video.description);

        await failDone(video.drop(), done);
        await failDone(recoveredVideo.drop(), done);

        done();
    });

});


