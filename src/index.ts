import { createServer, IncomingMessage, RequestListener, ServerResponse } from "http";
import * as dockerFunctions from "./docker";
import { allowedLanguages } from "./intefaces/allowedLanguages";
import { FILENAME, langToExecute, langToExtension } from "./utils/constants";
import { getIntialCommand, getRunCodeFileCommand } from "./utils/langToCommands"

interface createContainerReq {
    language: allowedLanguages
}
interface createExecReq {
    language: allowedLanguages | "shell"
    containerId: string,
    code: string,
    fileName?: string,
    run?: boolean,
}
interface killContainerReq {
    containerId: string
}



const readReq = (req: IncomingMessage): Promise<string> => {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => data += chunk.toString());
        req.on("error", (err) => reject(err.message));
        req.on("end", () => resolve(data));
    });
}



async function setUpContainer(language: allowedLanguages, containerId: string): Promise<boolean> {

    const { error } = await dockerFunctions.startContainer({ containerId });
    if (error) {
        console.log(error)
        return false
    }
    const INITIAL_COMMAND = getIntialCommand(language);

    const { error: execError } = await dockerFunctions.createAndStartExec({ containerId, command: INITIAL_COMMAND })
    if (execError) {
        console.log(execError);
        return false
    }
    return true
}


const checkLanguageIsAllowed = (language: string): language is allowedLanguages => {
    return language === "python" || language === "javascript" || language === "rust"
}
const checkReqIsCreateContainerReq = (reqData: any): reqData is createContainerReq => {
    return Object.keys(reqData).length === 1 && Object.hasOwn(reqData, "language") && checkLanguageIsAllowed(reqData["language"])
}
const checkReqIsKillContainerReq = (reqData: any): reqData is killContainerReq => {
    return Object.keys(reqData).length === 1 && Object.hasOwn(reqData, "containerId")
}
const checkReqIsCreateExecReq = (reqData: any): reqData is createExecReq => {
    return Object.hasOwn(reqData, "containerId") && Object.hasOwn(reqData, "language") && Object.hasOwn(reqData, "code") &&
        (checkLanguageIsAllowed(reqData["language"]) || reqData["language"] === "shell")
}

const prepareRes = (req: IncomingMessage, res: ServerResponse): ServerResponse => {
 return res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "")
}
const listener: RequestListener = async (req, res) => {



    const reqData = JSON.parse(await readReq(req));


    if (!checkReqIsCreateContainerReq(reqData) && !checkReqIsCreateExecReq(reqData) && !checkReqIsKillContainerReq(reqData)) {
        prepareRes(req, res).writeHead(400, "Bad request").end()
        return
    }

    if (req.method === "DELETE" && checkReqIsKillContainerReq(reqData)) {
        dockerFunctions.killContainer({ containerId: reqData.containerId });
        prepareRes(req, res).writeHead(200).end()
        return
    }

    if (checkReqIsCreateContainerReq(reqData)) {
        //the request is to create and set up the container
        const { language } = reqData


        const createContainerResp = await dockerFunctions.createContainer({ language });

        if (createContainerResp.error) {

            prepareRes(req, res).writeHead(500, createContainerResp.error).end()
            return
        }
        if (!createContainerResp.data) {
            prepareRes(req, res).writeHead(500, "Couldn't create container").end()
            return
        }

        const { containerId } = createContainerResp.data
        const containerSetupSuccess = await setUpContainer(language, containerId);
        if (!containerSetupSuccess) {
            prepareRes(req, res).writeHead(500, "Couldn't setup container").end()
            return
        }
        prepareRes(req, res).writeHead(201, "", { "Content-Type": "application/json" }).end(JSON.stringify({ containerId }))
        return
    }

    let { containerId, code, language, run, fileName } = reqData as createExecReq
    const command = prepareCommand(language, code, fileName || FILENAME, typeof run === "boolean" ? run : false);
    const output = await dockerFunctions.createAndStartExec({ containerId, command });
    if (output.error) {
        prepareRes(req, res).writeHead(500, output.error).end()
        return
    }
    if (!output.data) {
        prepareRes(req, res).writeHead(500, "no data").end()
        return
    }
    prepareRes(req, res).writeHead(201, "", { "Content-Type": "application/json" }).end(JSON.stringify(output.data))
}

function prepareCommand(language: createExecReq["language"], code: string, fileName: string, run: boolean): string {
    code = code.trim();
    code = code.replaceAll(/'(.*?)'/g, "\"$1\"")

    if (language === "shell") {
        return code
    }
    let fileToWriteTo: string;

    //if filename is say package.json, don't modify it, if it's main change it to main.js
    if (fileName.split('.').length === 2) {
        fileToWriteTo = fileName
    } else {
        fileToWriteTo = fileName + langToExtension[language]
    }


    const file = language !== "rust" ? fileToWriteTo : 'src/' + fileToWriteTo// for eg. file.py
    const writeCodeToFileCommand = `echo '${code}' > ${file};`

    let runCodeFileCommand = ""

    if (run) {
        runCodeFileCommand = getRunCodeFileCommand(language, file)
    }
    // const emptyFileCommand = `> ${file}`
    let command = writeCodeToFileCommand + runCodeFileCommand;
    if (language === "rust") {
        command = 'cd workdir;' + command
    }
    return command
}

const server = createServer(listener)
server.listen(process.env.PORT, () => { console.log(`server listening on ${process.env.PORT}`) });

