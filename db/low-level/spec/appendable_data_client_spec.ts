
import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { AppendableDataId, FromDataIDHandleResponse,
         AppedableDataMetadata } from "../src/ts/appendable-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("An appendable data client", () => {

    it("can create an appendable data", async (done) => {
        const appdat: AppendableDataId =
            await failDone(client.ad.create("Some name" + makeid()), done);
        done();
    });

    it("can read the metadata of a fresh appendable data", async (done) => {
        const appDataID: AppendableDataId =
            await failDone(client.ad.create("Some name" + makeid()), done);
        await failDone(client.ad.save(appDataID), done);
        const metadata: AppedableDataMetadata =
            await failDone(client.ad.getMetadata(appDataID), done);

        expect(metadata.dataLength).toBe(0);
        expect(metadata.isOwner).toBe(true);

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

    it("can append one appendable data to another", async (done) => {
        done(); // TODO(ethan,abdi): delete me

        const parent: AppendableDataId =
            await failDone(client.ad.create("Parent " + makeid()), done);
        await failDone(client.ad.save(parent), done);

        const child: AppendableDataId =
            await failDone(client.ad.create("Child " + makeid()), done);
        await failDone(client.ad.save(child), done);
        const childDataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(child), done);

        await failDone(client.ad.append(parent, childDataID), done);
        // await failDone(client.ad.update(parent), done);

        const parentMetadata: AppedableDataMetadata =
            await failDone(client.ad.getMetadata(parent), done);

        console.log(parentMetadata);

        const childDataId2: DataIDHandle =
            await failDone(client.ad.at(parent, 1), done);

        console.log(childDataId2);
        console.log(childDataID);

        done();
    });

});

