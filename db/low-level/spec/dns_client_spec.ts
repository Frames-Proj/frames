
import { makeid, client, TEST_DATA_DIR, exists, failDone, makeAlphaid } from "./test_util";
import { AuthorizationPayload } from "../src/ts/auth";
import { DnsClient } from "../src/ts/dns";
import * as stream from "stream";
import * as fs from "fs";


describe("An dns client", () => {

    it("can register a longName", async (done) => {
        const longName: string = makeAlphaid();

        await client.dns.register(longName).catch((err) => {
            fail(err);
            done();
        });

        done();
    });

    it("can register a longName and service", async (done) => {
        const longName: string = makeAlphaid();

        await client.dns.registerAndAddService(longName, "www", "app", "/").catch((err) => {
            fail(err);
            done();
        });

        done();
    });
});
