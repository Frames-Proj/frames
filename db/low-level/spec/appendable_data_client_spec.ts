
import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { AppendableDataId, FromDataIDHandleResponse } from "../src/ts/appendable-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("An appendable data client", () => {

    it("can create an appendable data", async (done) => {
        const appdat: AppendableDataId =
            await failDone(client.ad.create("Some name" + makeid()), done);
        done();
    });


    it("can convert an appendable-data-id to a data-id", async (done) => {
        const appDataID: AppendableDataId =
            await failDone(client.ad.create("Some name" + makeid()), done);
        const dataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(appDataID), done);
        done();
    });

    it("can convert an appendable-data-id to a data-id and back again", async (done) => {
        const appDataID: AppendableDataId =
            await failDone(client.ad.create("Some name" + makeid()), done);

        await failDone(client.ad.save(appDataID), done);

        const dataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(appDataID), done);

        const res: FromDataIDHandleResponse =
            await failDone(client.ad.fromDataIdHandle(dataID), done);
        done();
    });

});

