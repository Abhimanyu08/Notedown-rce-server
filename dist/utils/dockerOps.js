"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dockerFetch = void 0;
const http_1 = require("http");
function dockerFetch({ opts, body }) {
    return new Promise((resolve) => {
        let resData = "";
        const req = (0, http_1.request)(opts, (res) => {
            res.on("data", (chunk) => {
                resData += chunk.toString('utf-8');
            });
            res.on("error", (err) => {
                console.log(req.host);
                resolve({ error: err.message });
            });
            res.on("end", () => {
                const { statusCode } = res;
                if (statusCode && statusCode >= 400) {
                    resolve({ error: resData, dockerStatusCode: statusCode });
                    return;
                }
                resolve({
                    data: resData,
                    dockerStatusCode: statusCode,
                });
            });
        });
        if (body)
            req.write(JSON.stringify(body));
        req.end();
    });
}
exports.dockerFetch = dockerFetch;
//# sourceMappingURL=dockerOps.js.map