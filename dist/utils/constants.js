"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILENAME = exports.langToExecute = exports.langToExtension = exports.langToImage = void 0;
exports.langToImage = {
    python: "python:latest",
    javascript: "node:latest",
    rust: "rust:latest"
};
exports.langToExtension = {
    python: ".py",
    javascript: ".js",
    rust: ".rs"
};
exports.langToExecute = {
    python: "python",
    javascript: "node",
    rust: "cargo"
};
exports.FILENAME = "main";
//# sourceMappingURL=constants.js.map