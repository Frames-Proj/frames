
import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { AppendableDataHandle, FromDataIDHandleResponse,
         AppedableDataMetadata } from "../src/ts/appendable-data";
import { StructuredDataHandle, TYPE_TAG_VERSIONED } from "../src/ts/structured-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("An appendable data client", () => {

    it("can create an appendable data, and drop it", async (done) => {
        const appdat: AppendableDataHandle =
            await failDone(client.ad.create("Some name" + makeid()), done);
        await failDone(client.ad.save(appdat), done);
        await failDone(client.ad.drop(appdat), done);
        done();
    });

    it("can read the metadata of a fresh appendable data", async (done) => {
        const appDataID: AppendableDataHandle =
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
        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some name" + makeid()), done);
        const dataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(appDataID), done);
        done();
    });

    it("can convert an appendable-data-id to a data-id and back again", async (done) => {
        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some name" + makeid()), done);

        await failDone(client.ad.save(appDataID), done);

        const dataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(appDataID), done);

        const res: FromDataIDHandleResponse =
            await failDone(client.ad.fromDataIdHandle(dataID), done);
        done();
    });

    it("can append a structured data to an appendable data", async (done) => {
        const parentName: string = "Parent " + makeid();
        const childName: string = "Child " + makeid();

        // make the appendable data and save it to the network
        const parent: AppendableDataHandle =
            await failDone(client.ad.create(parentName), done);
        await failDone(client.ad.save(parent), done);

        const parentDataID: DataIDHandle =
            await failDone(client.ad.toDataIdHandle(parent), done);

        // make the structured data, and save it to the network
        const child: StructuredDataHandle =
            await failDone(client.structured.create(
                childName, TYPE_TAG_VERSIONED, {"child": true}), done);
        await failDone(client.structured.save(child), done);

        // append the data, creating a cleaning up a dataID handle along the way
        const childDataID: DataIDHandle =
            await failDone(client.structured.toDataIdHandle(child), done);
        await failDone(client.ad.append(parent, childDataID), done);
        await failDone(client.dataID.drop(childDataID), done);
        await failDone(client.structured.drop(child), done);

        // drop the parent handle so that we can refresh it
        await failDone(client.ad.drop(parent), done);

        const refreshedParent: FromDataIDHandleResponse =
            await failDone(client.ad.fromDataIdHandle(parentDataID), done);
        expect(refreshedParent.dataLength).toBe(1);
        const refreshedParrentHandle: AppendableDataHandle = refreshedParent.handleId;

        const childDataId2: DataIDHandle =
            await failDone(client.ad.at(refreshedParrentHandle, 0), done);
        const child2: StructuredDataHandle =
            (await failDone(client.structured.fromDataIdHandle(childDataId2), done)).handleId;
        const childContent = await failDone(client.structured.readAsObject(child2), done);
        expect(childContent.child).toBe(true);

        await failDone(client.structured.drop(child2), done);
        await failDone(client.ad.drop(refreshedParent.handleId), done);
        await failDone(client.dataID.drop(childDataId2), done);
        await failDone(client.dataID.drop(parentDataID), done);

        done();
    });

});

