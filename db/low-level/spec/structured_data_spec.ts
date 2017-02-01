
import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { StructuredDataHandle, TYPE_TAG_VERSIONED,
         FromDataIDHandleReponse, StructuredDataMetadata } from "../src/ts/structured-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("A structured data client", () => {

    it("can create a structured data handle, and save the data, and drop the handle", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(client.structured.save(structuredData), done);
        await failDone(client.structured.drop(structuredData), done);

        done();
    });

    it("can create a structured data with a buffer as the data", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, Buffer.from(JSON.stringify(data))), done);
        await failDone(client.structured.save(structuredData), done);
        await failDone(client.structured.drop(structuredData), done);

        done();
    });

    it("can create a structured data with an object as the data", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, data), done);
        await failDone(client.structured.save(structuredData), done);
        await failDone(client.structured.drop(structuredData), done);

        done();
    });

    it("can convert a structured data handle to a data-id and back again, dropping both handles",
       async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(client.structured.save(structuredData), done);

        const dataID: DataIDHandle =
            await failDone(client.structured.toDataIdHandle(structuredData), done);
        const anotherStructuredData: FromDataIDHandleReponse =
            await failDone(client.structured.fromDataIdHandle(dataID), done);

        await failDone(client.structured.drop(structuredData), done);
        await failDone(client.structured.drop(anotherStructuredData.handleId), done);
        await failDone(client.dataID.drop(dataID), done);

        done();
    });

    it("can get the metadata of a new structured data", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(client.structured.save(structuredData), done);

        const metadata: StructuredDataMetadata =
            await failDone(client.structured.getMetadata(structuredData), done);
        await failDone(client.structured.drop(structuredData), done);

        done();
    });

    fit("can create a structured data and read it back", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, data), done);
        await failDone(client.structured.save(structuredData), done);

        const result = await failDone(client.structured.readAsObject(structuredData), done);
        await failDone(client.structured.drop(structuredData), done);

        done();
    });
});

