import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { AppendableDataId } from "../src/ts/appendable-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("A data id client", () => {

    it("can serialise an appendable data dataID", async (done) => {
        const appDataID: AppendableDataId =
            await failDone(client.ad.create("Some random name"), done);
        const dataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(appDataID), done);

        const serialised: Buffer =
            await failDone(client.dataID.serialise(dataID), done);
        done();
    });

    fit("can serialise and deserialise an appendable data dataID", async (done) => {
        const appDataID: AppendableDataId =
            await failDone(client.ad.create("Some random name"), done);
        const dataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(appDataID), done);

        const serialised: Buffer =
            await failDone(client.dataID.serialise(dataID), done);
        const deserialised: DataIDHandle =
            await failDone(client.dataID.deserialise(serialised), done);

        expect(deserialised).toBe(dataID);
        done();
    });
});


