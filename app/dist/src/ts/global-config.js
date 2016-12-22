"use strict";
const error_1 = require("./error");
class Config {
    constructor() {
        this.APP_HOME_DIR = "/tmp/wha-wha-home";
        this.APP_NAME = "Frames";
        this.APP_ID = "todo.get.actual.domain";
        this.APP_VERSION = "0.0.1";
        this.APP_VENDOR = "Safety in Numbers";
        this.APP_PERMISSIONS = ["SAFE_DRIVE_ACCESS"];
        this.SAFE_LAUNCHER_ENDPOINT = 'http://localhost:8100';
        if (Config._instance) {
            throw new error_1.InstantiationError("Config");
        }
        Config._instance = this;
    }
    static getInstance() { return Config._instance; }
    makeAuthPayload() {
        return {
            "app": {
                "name": this.APP_NAME,
                "id": this.APP_ID,
                "version": this.APP_VERSION,
                "vendor": this.APP_VENDOR,
            },
            "permissions": this.APP_PERMISSIONS
        };
    }
}
Config._instance = new Config();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Config;
//# sourceMappingURL=global-config.js.map