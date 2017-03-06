
import { AppendableDataHandle, setCollectLeakStats, DataIDHandle,
         SerializedDataID, setCollectLeakStatsBlock } from "../index";

import { makeid, client, TEST_DATA_DIR, exists, failDone,
         checkForLeakErrors } from "./test_util";

describe("A data id client", () => {

    beforeAll(() => {
        setCollectLeakStats();
    });

    afterAll(() => {
        checkForLeakErrors();
    });

    it("can serialise an appendable data dataID", async (done) => {
        setCollectLeakStatsBlock("did:test1 serialize");

        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some random name"), done);
        const dataID: DataIDHandle =
            await failDone(appDataID.toDataIdHandle(), done);

        const serialised: Buffer =
            await failDone(dataID.serialise(), done);

        await failDone(dataID.drop(), done);
        done();
    });

    it("can serialise and deserialise an appendable data dataID", async (done) => {
        setCollectLeakStatsBlock("did:test2 serialize deserialise");

        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some random name"), done);
        const dataID: DataIDHandle =
            await failDone(appDataID.toDataIdHandle(), done);

        const serialised: SerializedDataID =
            await failDone(dataID.serialise(), done);
        const deserialised: DataIDHandle =
            await failDone(client.dataID.deserialise(serialised), done);

        await failDone(dataID.drop(), done);
        await failDone(deserialised.drop(), done);
        await failDone(appDataID.drop(), done);

        done();
    });
});


