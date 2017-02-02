/**
 *
 * File: src/ts/data-id.ts
 *
 * data IDs are references to various SafeNET primitives such as
 * appendable data or structured data. To create one, use the api
 * specific to that type of data. This module just include functions
 * for manipulating data IDs after they have been created.
 *
 */

import { ApiClient, ApiClientConfig } from "./client";
import { saneResponse, SafeError, UnexpectedResponseContent } from "./util";
import * as WebRequest from "web-request";
import { Response, Request } from "web-request";
import * as stream from "stream";

export type DataIDHandle = number;

export class DataIDClient extends ApiClient {

    constructor(conf: ApiClientConfig) {
        super(conf);
    }

    /**
    *
    * @param handleId - a handleId as obtained by creating and appendable or
    *                   structured data, and then converting it to a data-id.
    *                   This can be confusing, so see the tests in
    *                   `spec/data_id_spec.ts` for an example.
    * @returns The serialized handleId
    */
    public async serialise(handleId: DataIDHandle): Promise<Buffer> {
        const res: Response<string> =
            await saneResponse(WebRequest.create<string>(
            `${this.endpoint}/data-id/${handleId}`, {
                method: "GET",
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);

        return Buffer.from(res.content);
    };

    /**
    *
    * @param serializedHandle - The binary representation of the data handle
    *                           as returned by the serialize method.
    * @returns the handle that was serialized
    */
    public async deserialise(serializedHandle: Buffer | NodeJS.ReadableStream): Promise<DataIDHandle> {

        const payload = {
            method: "POST",
            auth: {
                bearer: (await this.authRes).token
            }
        };
        let req: Request<any>;
        if (serializedHandle instanceof Buffer) {
            payload["body"] = serializedHandle;
            req = WebRequest.create<any>(`${this.endpoint}/data-id`, payload);
        } else {
            req = serializedHandle.pipe(
                WebRequest.create<any>(`${this.endpoint}/data-id`, payload));
        }
        const response: Response<any> = await saneResponse(req.response);

        if (response.statusCode !== 200) {
            throw new SafeError(`statusCode=${response.statusCode} !== 200`,
                                response);
        }

        const resObj = JSON.parse(response.content);
        if (typeof resObj.handleId === "undefined") {
            throw new UnexpectedResponseContent(response);
        }
        return resObj.handleId;
    }

    /**
     *
     * @param handle - the structured data handle
     */
    public async drop(handle: DataIDHandle): Promise<void> {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.endpoint}/data-id/${handle}`, {
                method: "DELETE",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);
        if (result.statusCode !== 200) {
            throw new SafeError(`Bad statusCode=${result.statusCode}`, result);
        }
    }


}



