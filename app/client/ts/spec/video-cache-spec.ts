import { TEST_DATA_DIR, failDone, makeid,
         checkForLeakErrors, setupTestEnv } from "./test-util";
import { VideoFactory } from "../video-cache";
import Video from "../video-model";
import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle,
         setCollectLeakStats, setCollectLeakStatsBlock
       } from "safe-launcher-client";

import { safeClient as sc } from "../util";

describe("A Video factory", () => {

    beforeAll(async (done) => {
        await failDone(setupTestEnv(), done);
        done();
    });

    it("can be created", async done => {
        const vf: VideoFactory = await VideoFactory.getInstance();
        done();
    });

});
