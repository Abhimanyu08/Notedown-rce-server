"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRunCodeFileCommand = exports.getIntialCommand = void 0;
function getIntialCommand(language) {
    switch (language) {
        case "python":
            return '';
        case "javascript":
            return '';
        case "rust":
            return "cargo new workdir";
    }
}
exports.getIntialCommand = getIntialCommand;
function getRunCodeFileCommand(languauge, file) {
    switch (languauge) {
        case "python":
            return `python ${file};`;
        case "javascript":
            return `node ${file};`;
        case "rust":
            return "cargo run";
    }
}
exports.getRunCodeFileCommand = getRunCodeFileCommand;
//# sourceMappingURL=langToCommands.js.map