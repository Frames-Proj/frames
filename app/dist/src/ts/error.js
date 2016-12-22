"use strict";
class MaidSafeError {
    constructor() {
    }
    toString() {
        return `MaidSafeError::${this.show()}`;
    }
}
exports.MaidSafeError = MaidSafeError;
class SAFEAuthError extends MaidSafeError {
    constructor(subErr) {
        super();
        this.subErr = subErr;
    }
    show() {
        return `SAFEAuthError::${this.subErr != undefined ? this.subErr.toString() : ''}`;
    }
}
exports.SAFEAuthError = SAFEAuthError;
class SAFEDirCreationError extends MaidSafeError {
    constructor() {
        super();
    }
    show() { return "SAFEDirCreationError"; }
}
exports.SAFEDirCreationError = SAFEDirCreationError;
class InstantiationError {
    constructor(className) {
        this.className = className;
    }
    toString() {
        return `InstantiationError: Use ${this.className}.getInstance() instead of new.`;
    }
}
exports.InstantiationError = InstantiationError;
//# sourceMappingURL=error.js.map