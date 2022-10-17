import { createServer, IncomingMessage, RequestListener, ServerResponse } from "http";
import * as dockerFunctions from "./docker";
import { allowedLanguages } from "./intefaces/allowedLanguages";
import { FILENAME, langToExecute, langToExtension } from "./utils/constants";
import { getIntialCommand, getRunCodeFileCommand } from "./utils/langToCommands"

interface createContainerReq {
    language: allowedLanguages
}
interface createExecReq {
    language: allowedLanguages
    containerId: string,
    code: string,
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
        (checkLanguageIsAllowed(reqData["language"]) || reqData["language"] === "sh")
}

const prepareRes = (req: IncomingMessage, res: ServerResponse): ServerResponse => {
    if (req.headers.origin === "http://localhost:3000") return res.setHeader("Access-Control-Allow-Origin", req.headers.origin)
    return res
}
const listener: RequestListener = async (req, res) => {

    if (req.method === "OPTIONS") {
        res.writeHead(204, "", {
            "Access-Control-Allow-Origin": req.headers.origin,
            "Vary": "Origin",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": ["POST", "DELETE"]
        })
        res.end()
        return;
    }

    if (req.headers.origin !== "http://localhost:3000" && req.headers["user-agent"] !== process.env.USER_AGENT) {
        res.writeHead(401, "Bad request").end()
        return
    }

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

    let { containerId, code, language } = reqData as createExecReq
    const command = prepareCommand(code, language);
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

function prepareCommand(code: string, language: createExecReq["language"]): string {
    code = code.trim();
    code = code.replaceAll(/'(.*?)'/g, "\"$1\"")

    let lines = code.split('\n')
    const shellMatch = lines[0].match(/sh-(.+)/)
    if (shellMatch) {
        return shellMatch.at(1)?.trim() || ""
    }
    const fileMatch = lines[0].match(/file-(.+)/);
    let startCommand = language !== "rust" ? "" : "cd workdir;"
    let filename = language !== "rust" ? FILENAME : "main";
    if (fileMatch) {

        startCommand = `touch src/${fileMatch.at(1)}.${langToExtension[language]};`
        filename = fileMatch.at(1)!;
    }

    const file = `src/${filename}.${langToExtension[language]}` // for eg. file.py
    const writeCodeToFileCommand = `echo '${code}' > ${file};`
    const runCodeFileCommand = getRunCodeFileCommand(language, file)
    // const emptyFileCommand = `> ${file}`
    let command = startCommand + writeCodeToFileCommand + runCodeFileCommand;
    return command
}

const server = createServer(listener)
server.listen(process.env.PORT, () => { console.log(`server listening on ${process.env.PORT}`) });

// if (previousCode) {
    //     previousCode = previousCode.trim();
    //     previousCode = previousCode.replace(/\n/, "\\n");
    //     code = code.replace(/\n/, "\\n");
    //     command = `sed -i 's/^${previousCode}(.|\\n|\\r)*/${code}/' ${FILENAME}.${langToExtension[language]}; ${langToExecute[language]} ${FILENAME}.${langToExtension[language]}`;
    //     console.log(command);
    // }
    // const execDetails = await dockerClient.CREATE_EXEC(containerId, command)
    // if ("message" in execDetails) {
    //     res.writeHead(500, execDetails.message);
    //     res.end();
    //     return
    // }
    // const execId = execDetails.Id;
    // const output = await dockerClient.START_EXEC(execId)

