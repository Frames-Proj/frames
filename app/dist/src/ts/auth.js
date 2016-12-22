"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require("fs");
const WebRequest = require("web-request");
const error_1 = require("./error");
const mkpath = require('mkpath');
const global_config_1 = require('./global-config');
const CONFIG = global_config_1.default.getInstance();
const AUTH_FILE_NAME = CONFIG.APP_HOME_DIR + "/auth.dat";
class Auth {
    constructor() {
        if (Auth._instance) {
            throw new error_1.InstantiationError("Auth");
        }
        this.authRes = getAuth(Auth.authPayload);
        this.authRes.catch((fail) => {
            console.log("WE GOT AN ERROR (1)");
            console.log(fail.toString());
        });
        console.log(`Auth:: authRes=${this.authRes}`);
        Auth._instance = this;
    }
    static getInstance() { return this._instance; }
    get authResponse() { return this.authRes; }
    get token() {
        return this.authRes.then(res => {
            return Promise.resolve(res.token);
        });
    }
    get permissions() {
        return this.authRes.then((res) => {
            return Promise.resolve(res.permissions);
        });
    }
}
Auth.authPayload = {
    app: {
        name: CONFIG.APP_NAME,
        id: CONFIG.APP_ID,
        version: CONFIG.APP_VERSION,
        vendor: CONFIG.APP_VENDOR
    },
    permissions: CONFIG.APP_PERMISSIONS
};
Auth._instance = new Auth();
exports.Auth = Auth;
function getAuth(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`auth file: ${AUTH_FILE_NAME}`);
        const createDir = new Promise((resolve, reject) => {
            mkpath(CONFIG.APP_HOME_DIR, function (err) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        const authBlob = createDir.then((_) => {
            return new Promise((resolve, reject) => {
                fs.readFile(AUTH_FILE_NAME, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(JSON.parse(data.toString()));
                    }
                });
            });
        }).catch((err) => {
            console.log("failed to open file! !");
            const authResponse = WebRequest.create(CONFIG.SAFE_LAUNCHER_ENDPOINT + '/auth', {
                json: true,
                method: "POST",
                body: payload
            }).response.then((res) => {
                if (res.statusCode === 401) {
                    throw new error_1.SAFEAuthError();
                }
                else {
                    return res.content;
                }
            }).then((res) => {
                console.log(`writing ${JSON.stringify(res)} to file!!`);
                fs.writeFile(AUTH_FILE_NAME, JSON.stringify(res), (err) => {
                    console.error(`getAuth:: err=${err}`);
                    if (err)
                        throw err;
                });
                return Promise.resolve(res);
            });
            return authResponse;
        });
        return authBlob;
    });
}
//# sourceMappingURL=auth.js.map