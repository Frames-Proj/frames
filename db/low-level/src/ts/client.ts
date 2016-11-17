

/// <reference path="../../typings/index.d.ts" />

// File: client.ts
//
// Defines an abstract class from which all api clients derive
//

import { AuthResponse } from './auth';

export interface ApiClientConfig {
    readonly authRes : Promise<AuthResponse>;
    readonly endpoint : string;
}

export abstract class ApiClient {

    readonly authRes : Promise<AuthResponse>;
    readonly endpoint : string;

    // following the pattern where each client unpacks the
    // config information like this both makes for more ergonomic
    // access to the config info, and helps enforce the rule that
    // all clients are made only when a new top level SafeClient
    // is made
    constructor(conf: ApiClientConfig) {
        this.authRes = conf.authRes;
        this.endpoint = conf.endpoint;
    }

}
