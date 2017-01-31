
import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { AppendableDataId, FromDataIDHandleResponse,
         AppedableDataMetadata } from "../src/ts/appendable-data";
import { StructuredDataHandle, TYPE_TAG_VERSIONED } from "../src/ts/structured-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("An appendable data client", () => {

    it("can create an appendable data, and drop it", async (done) => {
        const appdat: AppendableDataId =
            await failDone(client.ad.create("Some name" + makeid()), done);
        await failDone(client.ad.save(appdat), done);
        await failDone(client.ad.drop(appdat), done);
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

        await failDone(client.ad.drop(appDataID), done);

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

    fit("can append one appendable data to another", async (done) => {
        const parentName: string = "Parent " + makeid();
        const childName: string = "Child " + makeid();

        let parent: AppendableDataId =
            await failDone(client.ad.create(parentName), done);
        await failDone(client.ad.save(parent), done);

        const child: StructuredDataHandle =
            await failDone(client.structured.create(
                childName, TYPE_TAG_VERSIONED, JSON.stringify({"child": true})), done);
        await failDone(client.structured.save(child), done);
        const childDataID: DataIDHandle =
            await failDone(client.structured.toDataIdHandle(child), done);

        console.log(await failDone(client.ad.getMetadata(parent), done));
        await failDone(client.ad.append(parent, childDataID), done);
        console.log(await failDone(client.ad.getMetadata(parent), done));

        // now drop the two metadata handles so that the change will be reflected
        // when we refresh
        await failDone(client.ad.drop(parent), done);
        // await failDone(client.ad.drop(child), done);

        // Get a refreshed version of the parent
        parent = await failDone(client.ad.create(parentName), done);
        console.log(await failDone(client.ad.getMetadata(parent), done));

        /*

        // await failDone(client.ad.update(parent), done);

        const parentMetadata: AppedableDataMetadata =
            await failDone(client.ad.getMetadata(parent), done);
        console.log(parentMetadata);

        const childDataId2: DataIDHandle =
            await failDone(client.ad.at(parent, 0), done);

        console.log(childDataId2);
        console.log(childDataID);
        */

        done();
    });

});

