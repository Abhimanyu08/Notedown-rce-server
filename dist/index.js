"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const dockerFunctions = __importStar(require("./docker"));
const constants_1 = require("./utils/constants");
const langToCommands_1 = require("./utils/langToCommands");
const readReq = (req) => {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => data += chunk.toString());
        req.on("error", (err) => reject(err.message));
        req.on("end", () => resolve(data));
    });
};
function setUpContainer(language, containerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = yield dockerFunctions.startContainer({ containerId });
        if (error) {
            console.log(error);
            return false;
        }
        const INITIAL_COMMAND = (0, langToCommands_1.getIntialCommand)(language);
        const { error: execError } = yield dockerFunctions.createAndStartExec({ containerId, command: INITIAL_COMMAND });
        if (execError) {
            console.log(execError);
            return false;
        }
        return true;
    });
}
const checkLanguageIsAllowed = (language) => {
    return language === "python" || language === "javascript" || language === "rust";
};
const checkReqIsCreateContainerReq = (reqData) => {
    return Object.keys(reqData).length === 1 && Object.hasOwn(reqData, "language") && checkLanguageIsAllowed(reqData["language"]);
};
const checkReqIsKillContainerReq = (reqData) => {
    return Object.keys(reqData).length === 1 && Object.hasOwn(reqData, "containerId");
};
const checkReqIsCreateExecReq = (reqData) => {
    return Object.hasOwn(reqData, "containerId") && Object.hasOwn(reqData, "language") && Object.hasOwn(reqData, "code") &&
        (checkLanguageIsAllowed(reqData["language"]) || reqData["language"] === "shell");
};
const prepareRes = (req, res) => {
    return res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "");
};
const listener = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reqData = JSON.parse(yield readReq(req));
    if (!checkReqIsCreateContainerReq(reqData) && !checkReqIsCreateExecReq(reqData) && !checkReqIsKillContainerReq(reqData)) {
        prepareRes(req, res).writeHead(400, "Bad request").end();
        return;
    }
    if (req.method === "DELETE" && checkReqIsKillContainerReq(reqData)) {
        dockerFunctions.killContainer({ containerId: reqData.containerId });
        prepareRes(req, res).writeHead(200).end();
        return;
    }
    if (checkReqIsCreateContainerReq(reqData)) {
        const { language } = reqData;
        const createContainerResp = yield dockerFunctions.createContainer({ language });
        if (createContainerResp.error) {
            prepareRes(req, res).writeHead(500, createContainerResp.error).end();
            return;
        }
        if (!createContainerResp.data) {
            prepareRes(req, res).writeHead(500, "Couldn't create container").end();
            return;
        }
        const { containerId } = createContainerResp.data;
        const containerSetupSuccess = yield setUpContainer(language, containerId);
        if (!containerSetupSuccess) {
            prepareRes(req, res).writeHead(500, "Couldn't setup container").end();
            return;
        }
        prepareRes(req, res).writeHead(201, "", { "Content-Type": "application/json" }).end(JSON.stringify({ containerId }));
        return;
    }
    let { containerId, code, language, run, fileName } = reqData;
    const command = prepareCommand(language, code, fileName || constants_1.FILENAME, typeof run === "boolean" ? run : false);
    const output = yield dockerFunctions.createAndStartExec({ containerId, command });
    if (output.error) {
        prepareRes(req, res).writeHead(500, output.error).end();
        return;
    }
    if (!output.data) {
        prepareRes(req, res).writeHead(500, "no data").end();
        return;
    }
    prepareRes(req, res).writeHead(201, "", { "Content-Type": "application/json" }).end(JSON.stringify(output.data));
});
function prepareCommand(language, code, fileName, run) {
    code = code.trim();
    code = code.replaceAll(/'(.*?)'/g, "\"$1\"");
    if (language === "shell") {
        return code;
    }
    let fileToWriteTo;
    if (fileName.split('.').length === 2) {
        fileToWriteTo = fileName;
    }
    else {
        fileToWriteTo = fileName + constants_1.langToExtension[language];
    }
    const file = language !== "rust" ? fileToWriteTo : 'src/' + fileToWriteTo;
    const writeCodeToFileCommand = `echo '${code}' > ${file};`;
    let runCodeFileCommand = "";
    if (run) {
        runCodeFileCommand = (0, langToCommands_1.getRunCodeFileCommand)(language, file);
    }
    let command = writeCodeToFileCommand + runCodeFileCommand;
    if (language === "rust") {
        command = 'cd workdir;' + command;
    }
    return command;
}
const server = (0, http_1.createServer)(listener);
server.listen(process.env.PORT, () => { console.log(`server listening on ${process.env.PORT}`); });
//# sourceMappingURL=index.js.map