"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareOptions = void 0;
const createReqWithSearchParams_1 = require("./createReqWithSearchParams");
function prepareOptions({ method, path, headers, queryOptions }) {
    if (queryOptions) {
        path = (0, createReqWithSearchParams_1.createReqWithSearchParams)(path, queryOptions);
    }
    return Object.assign({ hostname: '127.0.0.1', port: 2375, method,
        path }, (headers && {
        headers
    }));
}
exports.prepareOptions = prepareOptions;
//# sourceMappingURL=prepareOptions.js.map