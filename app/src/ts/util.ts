

export function unPromise<T, ResultT>(
    promise: Promise<T>,
    success: (v: T) => ResultT,
    fail: (v: any) => ResultT): ResultT {

    let res : ResultT;

    promise.then( (successResult) => {
        res = success(successResult);
    }).catch( (failureResult) => {
        res = fail(failureResult);
    });

    return res;
}

export function id<T>(x: T): T {
    return x;
}
