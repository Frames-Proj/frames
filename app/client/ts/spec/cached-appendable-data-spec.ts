//
//


import { TEST_DATA_DIR, failDone, makeid, checkForLeakErrors, diffFiles } from "./test-util";

import Video from "../video-model";
import { Maybe } from "../maybe";

import CachedAppendableDataHandle from "../cached-appendable-data";

import Config from "../global-config";
const CONFIG: Config = Config.getInstance();

import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle,
         setCollectLeakStats, setCollectLeakStatsBlock,
         AppendableDataHandle
       } from "safe-launcher-client";
import { safeClient as sc } from "../util";

import startupHook from "../startup-hooks";

describe("A cached appendable data.", () => {

    beforeAll(async (done) => {
        await failDone(startupHook(), done);
        setCollectLeakStats();
        CONFIG.setLongName(Maybe.just("uwotm8"));
        done();
    });

    it("can be created", async done => {
        setCollectLeakStatsBlock("cad:1 creation");

        const appdat: AppendableDataHandle =
            await failDone(sc.ad.create("Some name" + makeid()), done);
        await failDone(appdat.save(), done);
        const cachedAppdat: CachedAppendableDataHandle =
            await failDone(withDropP(await appdat.toDataIdHandle(),
                                     did => CachedAppendableDataHandle.new(did)), done);
        await failDone(cachedAppdat.drop(), done);

        done();
    });

    it("can be appended to", async done => {
        setCollectLeakStatsBlock("cad:2 append");

        const appdat: AppendableDataHandle =
            await failDone(sc.ad.create("Some name" + makeid()), done);
        await failDone(appdat.save(), done);
        const cachedAppdat: CachedAppendableDataHandle =
            await failDone(withDropP(await appdat.toDataIdHandle(),
                                     did => CachedAppendableDataHandle.new(did)), done);

        const sd1 = await failDone(
            sc.structured.create("sd1" + makeid(), TYPE_TAG_VERSIONED, "u wot m8"), done);
        await sd1.save();
        await failDone(cachedAppdat.append(await sd1.toDataIdHandle()), done);

        expect(cachedAppdat.length).toBe(1);

        const recoveredSd = await failDone(sc.structured.fromDataIdHandle(await cachedAppdat.at(0)), done);

        const sd1Content = await failDone(sd1.read(), done);
        const recoveredSdContent = await failDone(recoveredSd.handleId.read(), done);

        expect(sd1Content).toBe(recoveredSdContent);

        const sd2 = await failDone(
            sc.structured.create("sd2" + makeid(), TYPE_TAG_VERSIONED, "u wot m8"), done);
        await sd2.save();
        await failDone(cachedAppdat.append(await sd2.toDataIdHandle()), done);

        expect(cachedAppdat.length).toBe(2);

        await failDone(cachedAppdat.drop(), done);
        await failDone(sd1.drop(), done);
        await failDone(sd2.drop(), done);

        done();
    });
});
