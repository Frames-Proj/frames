import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { AppendableDataHandle } from "../src/ts/appendable-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("A data id client", () => {

    it("can serialise an appendable data dataID", async (done) => {
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
        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some random name"), done);
        const dataID: DataIDHandle =
            await failDone(appDataID.toDataIdHandle(), done);

        const serialised: Buffer =
            await failDone(dataID.serialise(), done);
        const deserialised: DataIDHandle =
            await failDone(client.dataID.deserialise(serialised), done);

        await failDone(dataID.drop(), done);

        done();
    });
});


