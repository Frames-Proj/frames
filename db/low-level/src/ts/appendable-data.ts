
import { UnexpectedResponseContent } from "./util";
import { ApiClient, ApiClientConfig } from "./client";
import { saneResponse } from "./util";
import { DataIDHandle } from "./data-id";
import * as WebRequest from "web-request";

import * as crypto from "crypto";


export type FilterType = "BlackList" | "WhiteList";

export type AppendableDataId = number;

export class AppendableDataClient extends ApiClient {

    readonly adEndpoint: string;

    constructor(conf: ApiClientConfig){
        super(conf);

        this.adEndpoint = this.endpoint + "/appendable-data";
    }


    /**
     *
     * @param name - a 32-byte identifier encoded as a base64 string
     * @param isPrivate - defaults to false
     * @param filterType
     * @param filterKeys - list of signing key handles
     * @returns the appendable data handle
     */
    public async create(name: string,
                        isPrivate: boolean = false,
                        filterType = "BlackList",
                        filterKeys = []): Promise<AppendableDataId> {
        if (typeof name === "string") {
            name = crypto.createHash("sha256").update(name).digest("base64");
        }
        const recBody = {
            name: name,
            isPrivate: isPrivate,
            filterType: filterType,
            filterKeys: filterKeys
        };
        const result = await saneResponse(WebRequest.create<any>(
            this.adEndpoint, {
                method: "POST",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                },
                body: recBody
            }).response);

        if (typeof result.content.handleId === "undefined") {
            throw new UnexpectedResponseContent(result);
        }
        return result.content.handleId;
    };

    /**
     *
     * @param id - the appendable data id to be converted
     * @returns a data id referring to the appendable data
     */
    public async toDataIdHandle(id: AppendableDataId): Promise<DataIDHandle>
    {
        const result = await saneResponse(WebRequest.create<any>(
            `${this.adEndpoint}/data-id/${id}`, {
                method: "GET",
                json: true,
                auth: {
                    bearer: (await this.authRes).token
                }
            }).response);

        if (typeof result.content.handleId === "undefined") {
            throw new UnexpectedResponseContent(result);
        }
        return result.content.handleId;
    }

}

