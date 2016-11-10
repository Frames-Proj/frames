
// File: util.ts
//
// Some utility functions
// 

import { Response } from 'web-request';
// import { Request } from "web-request";

export class SafeError extends Error {
    public message: string;
    public res: Response<any>;
    constructor(message : string, res: Response<any>) {
        super(message);
        this.res = res;
    }
}

// for use in a promise context
export function saneResponse<T>(res : Response<T>): Response<T> {
    if (res.statusCode === 401) { // 401 means that we were denied by the user
        throw new SafeError( 'Auth denied by safe launcher.', res );
    } else if (res.statusCode === 404) {
        throw new SafeError( 'endpoint not found.', res );
    } else if (res.statusCode !== 200) {
        throw new SafeError(`statusCode=${res.statusCode}`, res);
    } else {
        return res;
    }
}
