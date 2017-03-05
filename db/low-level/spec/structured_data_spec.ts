
import { makeid, client, TEST_DATA_DIR, exists, failDone,
         checkForLeakErrors } from "./test_util";
import { StructuredDataHandle, TYPE_TAG_VERSIONED,
         StructuredDataMetadata, DataIDHandle, SerializedDataID,
         setCollectLeakStats, setCollectLeakStatsBlock,
         StructuredDeserialiseResponse
       } from "../index";

describe("A structured data client", () => {

    beforeAll(() => {
        setCollectLeakStats();
    });

    afterAll(() => {
        checkForLeakErrors();
    });

    it("can create a structured data handle, and save the data, and drop the handle", async (done) => {
        setCollectLeakStatsBlock("sd:test1: create save drop");

        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, JSON.stringify(data)), done);
        await failDone(structuredData.save(), done);
        await failDone(structuredData.drop(), done);

        done();
    });

    it("can create a structured data with a buffer as the data", async (done) => {
        setCollectLeakStatsBlock("sd:test2: create buffer");

        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, Buffer.from(JSON.stringify(data))), done);
        await failDone(structuredData.save(), done);
        await failDone(structuredData.drop(), done);

        done();
    });

    it("can create a structured data with an object as the data", async (done) => {
        setCollectLeakStatsBlock("sd:test3: create object");

        const data = {"hello": "world"};

        const structuredData: StructuredDataHandle =
            await failDone(client.structured.create(
                "Some Name" + makeid(), TYPE_TAG_VERSIONED, data), done);
        await failDone(structuredData.save(), done);
        await failDone(structuredData.drop(), done);

        done();
    });

    it("can convert a structured data handle to a data-id and back again, dropping both handles", async (done) => {
        setCollectLeakStatsBlock("sd:test4: data-id round trip");

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
        setCollectLeakStatsBlock("sd:test5: metadata");

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
        setCollectLeakStatsBlock("sd:test6: create read");

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
        setCollectLeakStatsBlock("sd:test7: create read string");

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

