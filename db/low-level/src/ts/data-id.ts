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
import { saneResponse, SafeError, UnexpectedResponseContent
         , InvalidHandleError, assert } from "./util";
import * as WebRequest from "web-request";
import { Response, Request } from "web-request";
import * as stream from "stream";
import { Handle } from "./raii";

export type SerializedDataID = Buffer;

export class DataIDClient extends ApiClient {

    constructor(conf: ApiClientConfig) {
        super(conf);
    }

    /**
    *
    * @param serializedHandle - The binary representation of the data handle
    *                           as returned by the serialize method.
    * @returns the handle that was serialized
    */
    public async deserialise(serializedHandle: SerializedDataID | NodeJS.ReadableStream): Promise<DataIDHandle> {

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

        return new DataIDHandle(this, resObj.handleId);
    }

}


export class DataIDHandle extends Handle {

    constructor(c: ApiClient, handle: number) {
        super(c, handle);
    }

    /**
    *
    * @returns The serialised handleId
    */
    public async serialise(): Promise<SerializedDataID> {
        if (!this.valid)
            throw new InvalidHandleError(this.handle, "DataIDHandle:serialise");

        const res: Response<Buffer> =
            await saneResponse(WebRequest.create<Buffer>(
            `${this.client.endpoint}/data-id/${this.handle}`, {
                method: "GET",
                auth: {
                    bearer: (await this.client.authRes).token
                },
                encoding: null
            }).response);

        return res.content;
    }


    /**
     *
     */
    protected async dropImpl(): Promise<void> {
        if (!this.valid) return; // we want drop to be idempotent. It lets us be imprecise about ownership

        const result = await saneResponse(WebRequest.create<any>(
            `${this.client.endpoint}/data-id/${this.handle}`, {
                method: "DELETE",
                json: true,
                auth: {
                    bearer: (await this.client.authRes).token
                }
            }).response);
        if (result.statusCode !== 200) {
            throw new SafeError(`Bad statusCode=${result.statusCode}`, result);
        }
    }


}




