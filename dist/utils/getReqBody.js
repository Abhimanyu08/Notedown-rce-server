"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCreateContainerReqBody = void 0;
const constants_1 = require("./constants");
function getCreateContainerReqBody(language) {
    switch (language) {
        case "python":
            return {
                "Image": constants_1.langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            };
        case "javascript":
            return {
                "Image": constants_1.langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            };
        case "rust":
            return {
                "Image": constants_1.langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            };
    }
}
exports.getCreateContainerReqBody = getCreateContainerReqBody;
//# sourceMappingURL=getReqBody.js.map