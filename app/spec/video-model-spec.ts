
import { TEST_DATA_DIR, failDone, makeid } from "./test-util";

import { Video, getVideo } from "../src/ts/video-model";

import Config from "../src/ts/global-config";
const CONFIG: Config = Config.getInstance();

import { TYPE_TAG_VERSIONED } from "safe-launcher-client";
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
        await failDone(video.write(), done);

        done();
    });

});


