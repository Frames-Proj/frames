
import { makeid, client, TEST_DATA_DIR, exists, failDone } from './test_util';

describe("An appendable data client", () => {

    it("can create an appendable data", async (done) => {
        // const dirResponse : Promise<NfsDirectoryInfo> =
        //     client.nfs.dir.get("app", "safe-client-test-bogus").catch((err) => {
        //         expect(err.res.statusCode).toBe(404);
        //         done();
        //     });

        const appdat = await client.ad.create("Some name").catch( (err) => {
            console.error(err);
            console.error(JSON.stringify(err));
            fail();
            done();
        });
        done();
    });
});

