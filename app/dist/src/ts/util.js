"use strict";
function unPromise(promise, success, fail) {
    let res;
    promise.then((successResult) => {
        res = success(successResult);
    }).catch((failureResult) => {
        res = fail(failureResult);
    });
    return res;
}
exports.unPromise = unPromise;
function id(x) {
    return x;
}
exports.id = id;
//# sourceMappingURL=util.js.map