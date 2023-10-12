"use strict";
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
exports.pullImage = exports.createAndStartExec = exports.startExec = exports.createExec = exports.killContainer = exports.startContainer = exports.createContainer = exports.listContainers = void 0;
require("dotenv/config");
const dockerOps_1 = require("./utils/dockerOps");
const prepareOptions_1 = require("./utils/prepareOptions");
const getReqBody_1 = require("./utils/getReqBody");
const constants_1 = require("./utils/constants");
function listContainers() {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = (0, prepareOptions_1.prepareOptions)({ method: "GET", path: "/containers/json" });
        console.log(opts);
        const { data, error } = yield (0, dockerOps_1.dockerFetch)({ opts });
        if (error) {
            return { error };
        }
        if (data) {
            const containerArray = JSON.parse(data);
            return { data: containerArray };
        }
        return {
            error: "Unknown error"
        };
    });
}
exports.listContainers = listContainers;
function createContainer({ language }) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = (0, prepareOptions_1.prepareOptions)({ method: "POST", path: "/containers/create", headers: { "Content-Type": "application/json" } });
        let body = (0, getReqBody_1.getCreateContainerReqBody)(language);
        let createContainerResp = yield (0, dockerOps_1.dockerFetch)({ opts, body });
        if (!createContainerResp.error && createContainerResp.data) {
            const { data: dataString } = createContainerResp;
            const { Id } = JSON.parse(dataString);
            return { data: { containerId: Id } };
        }
        if (createContainerResp.dockerStatusCode === 404) {
            const imageName = constants_1.langToImage[language];
            const pullImageResp = yield pullImage({ imageName });
            if (pullImageResp.error) {
                return { error: pullImageResp.error };
            }
            return createContainer({ language });
        }
        return { error: createContainerResp.error };
    });
}
exports.createContainer = createContainer;
function startContainer({ containerId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = (0, prepareOptions_1.prepareOptions)({ method: "POST", path: `/containers/${containerId}/start` });
        return (0, dockerOps_1.dockerFetch)({ opts });
    });
}
exports.startContainer = startContainer;
function killContainer({ containerId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = (0, prepareOptions_1.prepareOptions)({ method: "POST", path: `/containers/${containerId}/kill` });
        return (0, dockerOps_1.dockerFetch)({ opts });
    });
}
exports.killContainer = killContainer;
function createExec({ containerId, command }) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = (0, prepareOptions_1.prepareOptions)({ method: "POST", path: `/containers/${containerId}/exec`, headers: { "Content-Type": "application/json" } });
        const body = {
            "AttachStdout": true,
            "AttachStderr": true,
            "Tty": true,
            "Cmd": ["sh", "-c", command],
            "WorkingDir": "/app"
        };
        const { data: createExecData, error } = yield (0, dockerOps_1.dockerFetch)({ opts, body });
        if (error) {
            return { error };
        }
        if (!createExecData) {
            return { error: "No data" };
        }
        const { Id } = JSON.parse(createExecData);
        return { data: { execId: Id } };
    });
}
exports.createExec = createExec;
function startExec({ execId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = (0, prepareOptions_1.prepareOptions)({ method: "POST", path: `/exec/${execId}/start`, headers: { "Content-Type": "application/json" } });
        const body = {
            "Detach": false,
            "Tty": true
        };
        const { data: startExecData, error } = yield (0, dockerOps_1.dockerFetch)({ opts, body });
        if (error) {
            return { error };
        }
        if (startExecData === undefined) {
            return { error: "Not able to execute command" };
        }
        return { data: { output: startExecData } };
    });
}
exports.startExec = startExec;
function createAndStartExec({ containerId, command }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, error } = yield createExec({ containerId, command });
        if (error)
            return { error };
        if (!data)
            return { error: "Couldn't create exec instance" };
        const executionOutput = startExec({ execId: data.execId });
        return executionOutput;
    });
}
exports.createAndStartExec = createAndStartExec;
function pullImage({ imageName }) {
    return __awaiter(this, void 0, void 0, function* () {
        const opts = (0, prepareOptions_1.prepareOptions)({ method: 'POST', path: "/images/create", queryOptions: { fromImage: imageName } });
        return (0, dockerOps_1.dockerFetch)({ opts });
    });
}
exports.pullImage = pullImage;
//# sourceMappingURL=docker.js.map