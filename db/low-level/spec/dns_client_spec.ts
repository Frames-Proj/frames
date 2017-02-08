
import { makeid, client, TEST_DATA_DIR, exists, failDone, makeAlphaid } from "./test_util";
import { AuthorizationPayload } from "../src/ts/auth";
import { DnsClient, DnsServiceList, DnsHomeDirectory } from "../src/ts/dns";
import * as stream from "stream";
import * as fs from "fs";


describe("An dns client", () => {

    it("can register a longName", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.register(longName), done);
        done();
    });

    it("can register a longName and service", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);
        done();
    });

    it("can list the services mapped to a longName", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);

        const expectedServices: DnsServiceList = ["www"];

        const services: DnsServiceList = await client.dns.getServices(longName);
        expect(expectedServices).toEqual(services);
        done();
    });

    it("can map a service to an existing longName", async (done) => {
        const longName: string = makeAlphaid();
        await failDone(client.dns.registerAndAddService(longName, "www", "app", "/"), done);

        await failDone(client.dns.addService(longName, "zzz", "app", "/"), done);
        const expectedServices: DnsServiceList = ["zzz", "www"];

        const services: DnsServiceList = await client.dns.getServices(longName);
        expect(expectedServices.sort()).toEqual(services.sort());
        done();
    });
});
