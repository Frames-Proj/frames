
import { makeid, client, TEST_DATA_DIR, exists, failDone } from "./test_util";
import { StructuredDataHandle, TYPE_TAG_VERSIONED,
         DeserializeReponse, StructuredDataMetadata,
         SerializedStructuredData } from "../src/ts/structured-data";
import { DataIDHandle, SerializedDataID } from "../src/ts/data-id";

describe("A structured data client", () => {

    it("can create a structured data handle, and save the data, and drop the handle", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(structuredData.save(), done);
        await failDone(structuredData.drop(), done);

        done();
    });

    it("can create a structured data with a buffer as the data", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, Buffer.from(JSON.stringify(data))), done);
        await failDone(structuredData.save(), done);
        await failDone(structuredData.drop(), done);

        done();
    });

    it("can create a structured data with an object as the data", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, data), done);
        await failDone(structuredData.save(), done);
        await failDone(structuredData.drop(), done);

        done();
    });

    it("can convert a structured data handle to a data-id and back again, dropping both handles",
       async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(structuredData.save(), done);

        // serialise and deserialise the dataID
        const dataID: DataIDHandle =
               await failDone(structuredData.toDataIdHandle(), done);
        const sDId: SerializedDataID = await failDone(dataID.serialise(), done);
        const deDId: DataIDHandle = await failDone(client.dataID.deserialise(sDId), done);

        const anotherStructuredData: DeserializeReponse =
            await failDone(client.structured.fromDataIdHandle(dataID), done);
        // const anotherStructuredData: FromDataIDHandleReponse =
        //    await failDone(client.structured.fromDataIdHandle(deDId), done);

        await failDone(dataID.drop(), done);
        // await failDone(deDId.drop(), done);
        await failDone(structuredData.drop(), done);
        await failDone(anotherStructuredData.handleId.drop(), done);

        done();
    });

    it("can convert a structured data handle to a data-id and back again, dropping both handles", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(structuredData.save(), done);

        const dataId = await failDone(structuredData.toDataIdHandle(), done);
        await failDone(structuredData.drop(), done);
        const xorName = await failDone(dataId.serialise(), done);
        await failDone(dataId.drop(), done);
        const dataIdNew = await failDone(client.dataID.deserialise(xorName), done);
        const structedDataNew = await failDone(client.structured.fromDataIdHandle(dataIdNew), done);

        const content = JSON.parse(await failDone(structedDataNew.handleId.read(), done));
        expect(content["hello"]).toBe("world");

        await failDone(dataIdNew.drop(), done);
        await failDone(structedDataNew.handleId.drop(), done);

        done();
    });

    it("can get the metadata of a new structured data", async (done) => {
        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(structuredData.save(), done);

        const metadata: StructuredDataMetadata =
            await failDone(structuredData.getMetadata(), done);
        await failDone(structuredData.drop(), done);

        done();
    });

    it("can create a structured data and read it back", async (done) => {
        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, {"hello": "world"}), done);
        await failDone(structuredData.save(), done);

        const result: any =
            await failDone(structuredData.readAsObject(), done);
        expect(result.hello).toBe("world");

        await failDone(structuredData.drop(), done);

        done();
    });

    it("can create a structured data and read it back with a string as the input data", async (done) => {
        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, "hello world"), done);
        await failDone(structuredData.save(), done);

        const result: any =
            await failDone(structuredData.read(), done);
        expect(result).toBe("hello world");

        await failDone(structuredData.drop(), done);

        done();
    });


});

