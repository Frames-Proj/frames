import { UserProfileData, UserProfile, currentUserProfile } from "../user-model";
import { safeClient } from "../util";
import { sleep, makeid, makeAlphaid, failDone, setupTestEnv, TEST_DATA_DIR } from "./test-util";
import Config from "../global-config";
import { Maybe } from "../maybe";
import { VideoFactory } from "../video-cache";
import Video from "../video-model";

const CONFIG: Config = Config.getInstance();

let VALID_LONG_NAME: string;
const HOME_DIR: string = makeAlphaid().toLowerCase();

describe("The user profile data store", () => {

    beforeAll(async (done) => {
        await failDone(setupTestEnv(), done);
        done();
    });

    beforeAll(async (done) => {
        VALID_LONG_NAME = makeAlphaid().toLowerCase();

        await failDone(safeClient.nfs.dir.create("app", HOME_DIR, false), done);
        await failDone(safeClient.dns.registerAndAddService(
            VALID_LONG_NAME, CONFIG.SERVICE_NAME, "app", HOME_DIR), done);
        CONFIG.setLongName(Maybe.just(VALID_LONG_NAME));

        done();
    });

    it("can detect when no profile exists", async done => {
        try {
            const profile: UserProfile = await UserProfile.read("does-not-exist");
        } catch (e) {
            done();
            return;
        }
        fail();
    });

    it("can get the data from an existing home directory", async done => {
        const profile: UserProfile = await failDone(UserProfile.read(VALID_LONG_NAME), done);
        expect(profile.data.uploadedVideos.length).toBe(0);
        expect(profile.data.playlists.length).toBe(0);

        const newUserData: UserProfileData = {
            playlists: ["playlist1"],
            uploadedVideos: ["video1", "video2"]
        };

        profile.data = newUserData;
        await failDone(profile.write(), done);
        const updatedProfile: UserProfile = await failDone(UserProfile.read(VALID_LONG_NAME), done);
        expect(updatedProfile.data.uploadedVideos).toEqual(["video1", "video2"]);
        expect(updatedProfile.data.playlists).toEqual(["playlist1"]);
        done();
    });

    it("is updated when we add a video", async done => {
        const vf: VideoFactory = await VideoFactory.getInstance();

        const video: Video =
            await failDone(vf.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        await currentUserProfile.caseOf<Promise<void>>({
            nothing: () => { fail("no user profile!"); done(); return <Promise<void>>null; },
            just: async p => {
                expect((await p).data.uploadedVideos).toContain(await video.stringXorName());
            }
        });

        await failDone(video.drop(), done);
        done();
    });

    it("does not break when we upload a second video.", async done => {
        const vf: VideoFactory = await VideoFactory.getInstance();

        const v1: Video =
            await failDone(vf.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);
        const v2: Video =
            await failDone(vf.new("title " + makeid(), "A description.",
                                    `${TEST_DATA_DIR}/test-vid.mp4`), done);

        await failDone(currentUserProfile.caseOf<Promise<void>>({
            nothing: () => { fail("no user profile!"); done(); return <Promise<void>>null; },
            just: async p => {
                const uvs: string[] = (await p).data.uploadedVideos;
                expect(uvs).toContain(await v1.stringXorName());
                expect(uvs).toContain(await v2.stringXorName());
            }
        }), done);

        await failDone(v1.drop(), done);
        done();
    });

});
