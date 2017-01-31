
import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { StructuredDataHandle, TYPE_TAG_VERSIONED,
         FromDataIDHandleReponse, StructuredDataMetadata } from "../src/ts/structured-data";
import { DataIDHandle } from "../src/ts/data-id";

describe("A structured data client", () => {

    it("can create a structured data handle, and save it", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(client.structured.save(structuredData), done);

        done();
    });

    it("can convert a structured data handle to a data-id and back again", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(client.structured.save(structuredData), done);

        const dataID: DataIDHandle =
            await failDone(client.structured.toDataIdHandle(structuredData), done);
        const anotherStructuredData: FromDataIDHandleReponse =
            await failDone(client.structured.fromDataIdHandle(dataID), done);

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

        done();
    });
});

