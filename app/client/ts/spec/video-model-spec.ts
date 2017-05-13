import { TEST_DATA_DIR, failDone, makeid,
         checkForLeakErrors, diffFiles, setupTestEnv } from "./test-util";
import Video from "../video-model";
import { TYPE_TAG_VERSIONED, DataIDHandle,
         SerializedDataID, withDropP, StructuredDataHandle,
         setCollectLeakStats, setCollectLeakStatsBlock
       } from "safe-launcher-client";
import { safeClient } from "../util";
import { VideoFactory } from "../video-cache";

describe("A frames Video model", () => {

    beforeAll(async (done) => {
        await failDone(setupTestEnv(), done);
        done();
    });

    afterAll(() => {
        checkForLeakErrors();
    });

    it("can be recovered from a serialized dataID.", async (done) => {
        setCollectLeakStatsBlock("vms:test2 recover");
        const vf: VideoFactory = await VideoFactory.getInstance();

        const video: Video =
            await failDone(vf.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await failDone(withDropP(await video.xorName(), (dId: DataIDHandle) => {
                return dId.serialise();
            }), done);

        const recoveredVideo: Video =
            await failDone(withDropP(await safeClient.dataID.deserialise(dataId), (dIdH) => {
                return vf.read(dIdH);
            }), done);

        expect(recoveredVideo.title).toBe(video.title);
        expect(recoveredVideo.description).toBe(video.description);

        await failDone(video.drop(), done);
        await failDone(recoveredVideo.drop(), done);

        done();
    });

    it("can be a reply to another video.", async (done) => {
        setCollectLeakStatsBlock("vms:test3 create reply");
        const vf: VideoFactory = await VideoFactory.getInstance();

        const parent: Video =
            await failDone(vf.new("title " + makeid(), "Parent description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        parent.parentVideoXorName.caseOf({
            nothing: () => null,
            just: _ => fail()
        });

        const child: Video =
            await failDone(parent.addVideoReply("child title " + makeid(),
                            "The child description.", `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const parentXorName: string =
            await failDone(withDropP(await parent.xorName(),
                                     async n => (await n.serialise()).toString("base64")), done);

        expect(child.parentVideoXorName.valueOr(parentXorName + "FAIL")).toBe(parentXorName);

        await parent.drop();
        await child.drop();

        done();
    });

    it("can find its parent after being serialized.", async (done) => {
        setCollectLeakStatsBlock("vms:test3 round-trip parent");
        const vf: VideoFactory = await VideoFactory.getInstance();

        const parent: Video =
            await failDone(vf.new("title " + makeid(), "Parent description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        const child: Video =
            await failDone(parent.addVideoReply("child title " + makeid(),
                            "The child description.", `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await failDone(withDropP(await child.xorName(), (dId: DataIDHandle) => {
                return dId.serialise();
            }), done);

        const recoveredChild: Video =
            await failDone(withDropP(await safeClient.dataID.deserialise(dataId), (dIdH) => {
                return vf.read(dIdH);
            }), done);
        expect(recoveredChild.title).toBe(child.title);
        expect(recoveredChild.description).toBe(child.description);

        const recoveredParent: Video =
            await failDone(vf.readFromStringXorName(
                recoveredChild.parentVideoXorName.valueOr("BOGUS")), done);
        expect(recoveredParent.title).toBe(parent.title);
        expect(recoveredParent.description).toBe(parent.description);

        const parentsChild: Video = await failDone(recoveredParent.getReplyVideo(0), done);
        expect(parentsChild.title).toBe(child.title);
        expect(parentsChild.description).toBe(child.description);


        await failDone(parent.drop(), done);
        await failDone(child.drop(), done);
        await failDone(recoveredChild.drop(), done);
        await failDone(recoveredParent.drop(), done);
        await failDone(parentsChild.drop(), done);

        done();
    });

    it("can be read without downloading the whole video.", async (done) => {
        setCollectLeakStatsBlock("vms:test4 no video file");
        const vf: VideoFactory = await VideoFactory.getInstance();

        const video: Video =
            await failDone(vf.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await failDone(withDropP(await video.xorName(), (dId: DataIDHandle) => {
                return dId.serialise();
            }), done);

        const recoveredVideo: Video =
            await failDone(withDropP(await safeClient.dataID.deserialise(dataId), (dIdH) => {
                return vf.read(dIdH, false);
            }), done);

        expect(recoveredVideo.title).toBe(video.title);
        expect(recoveredVideo.description).toBe(video.description);

        recoveredVideo.file.caseOf({
            just: _ => { fail(); done(); },
            nothing: () => null
        });

        await failDone(video.drop(), done);
        await failDone(recoveredVideo.drop(), done);

        done();
    });

    it("can get it's child's XorName as a string.", async (done) => {
        setCollectLeakStatsBlock("vms:test5 round-trip parent");
        const vf: VideoFactory = await VideoFactory.getInstance();

        const parent: Video =
            await failDone(vf.new("title " + makeid(), "Parent description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        const child: Video =
            await failDone(parent.addVideoReply("child title " + makeid(),
                            "The child description.", `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const recoveredParent: Video =
            await failDone(withDropP(await parent.xorName(), async pname => {
                return await vf.read(pname, false);
            }), done);

        const childXorName = await failDone(recoveredParent.getReplyVideoXorName(0), done);
        const recoveredChild: Video =
            await failDone(vf.readFromStringXorName(childXorName), done);

        expect(recoveredChild.title).toBe(child.title);
        expect(recoveredChild.description).toBe(child.description);

        await failDone(parent.drop(), done);
        await failDone(child.drop(), done);
        await failDone(recoveredChild.drop(), done);
        await failDone(recoveredParent.drop(), done);

        done();
    });

    it("has a thumbnail image, which survives a round trip.", async (done) => {
        setCollectLeakStatsBlock("vms:test6 thumbnail");
        const vf: VideoFactory = await VideoFactory.getInstance();

        const video: Video =
            await failDone(vf.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        const dataId: SerializedDataID =
            await failDone(withDropP(await video.xorName(), (dId: DataIDHandle) => {
                return dId.serialise();
            }), done);

        const recoveredVideo: Video =
            await failDone(withDropP(await safeClient.dataID.deserialise(dataId), (dIdH) => {
                return vf.read(dIdH);
            }), done);

        expect(await diffFiles(await video.thumbnailFile, await recoveredVideo.thumbnailFile)).toBe(true);

        await failDone(video.drop(), done);
        await failDone(recoveredVideo.drop(), done);

        done();
    });

});


