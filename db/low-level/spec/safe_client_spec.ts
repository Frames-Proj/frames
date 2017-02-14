
import { client } from "./test_util";

describe("A SafeClient ", () => {

    // smoke test
    it("can authenticate with the safe_launcher", (done) => {
        (async function() {

            client.authResponse.catch( (err) => {
                expect(err).toBe(undefined);
            });

            expect(await client.authenticated()).toBe(true);

            done();
        })();
    });

});
