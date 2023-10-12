"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReqWithSearchParams = void 0;
function createReqWithSearchParams(path, options) {
    let s = `${path}?`;
    for (let [key, value] of Object.entries(options)) {
        s = s.concat(`${key}=${value}`);
    }
    return s;
}
exports.createReqWithSearchParams = createReqWithSearchParams;
//# sourceMappingURL=createReqWithSearchParams.js.map