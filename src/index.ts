import { createServer, IncomingMessage, RequestListener } from "http";
import * as dockerFunctions from "./docker";

const FILENAME = "file";

interface createContainerReq {
    language: "python" | "javascript"
}
interface createExecReq {
    language: "python" | "javascript"
    containerId: string,
    code: string
}

const langToImage = {
    python: "python:3",
    javascript: "node:18-alpine"
} as const

const langToExtension = {
    python: "py",
    javascript: "js"
} as const

const langToExecute = {
    python: "python",
    javascript: "node"
} as const

const readReq = (req: IncomingMessage): Promise<string> => {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => data += chunk.toString());
        req.on("error", (err) => reject(err.message));
        req.on("end", () => resolve(data));
    });
}



async function setUpContainer(language: createContainerReq["language"], containerId: string): Promise<boolean> {

    const { data, error } = await dockerFunctions.startContainer({ containerId });
    if (error) return false
    const INITIAL_COMMAND = `touch ${FILENAME}.${langToExtension[language]}`
    const { error: execError } = await dockerFunctions.createAndStartExec({ containerId, command: INITIAL_COMMAND })
    if (execError) {
        console.log(execError);
        return false
    }
    return true
}

const listener: RequestListener = async (req, res) => {

    if (req.method === "OPTIONS") {
        res.writeHead(204, "", {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Vary": "Origin",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": ["POST"]
        })
        res.end()
        return;
    }

    const reqData: createContainerReq | createExecReq = JSON.parse(await readReq(req));

    if (!("containerId" in reqData)) {
        //the request is to create and set up the container, not to run code
        const { language } = reqData
        const imageName = langToImage[language];
        const createContainerResp = await dockerFunctions.createContainer({ imageName });
        if (createContainerResp.error) {
            res.writeHead(500, createContainerResp.error).end()
            return
        }
        if (!createContainerResp.data) {
            res.writeHead(500, "Couldn't create container").end()
            return
        }

        const { containerId } = createContainerResp.data
        const containerSetupSuccess = await setUpContainer(language, containerId);
        if (!containerSetupSuccess) {
            res.writeHead(500, "Couldn't setup container").end()
            return
        }
        res.writeHead(201, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000" });
        res.end(JSON.stringify({ containerId }))
        return
    }

    let { containerId, code, language } = reqData
    const command = prepareCommand(code, language);
    console.log(command)
    const output = await dockerFunctions.createAndStartExec({ containerId, command });
    if (output.error) {
        res.writeHead(500, output.error).end();
        return
    }
    if (!output.data) {
        res.writeHead(500, "no data").end();
        return
    }
    res.writeHead(201, "success", { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000" });
    res.end(JSON.stringify(output.data));
}

function prepareCommand(code: string, language: createExecReq["language"]): string {
    code = code.trim();
    code = code.replaceAll(/'(.*?)'/g, "\"$1\"")
    let lines = code.split('\n')
    const fileMatch = lines[0].match(/file-(.+)/);
    let startCommand = ''
    let filename = FILENAME
    if (fileMatch) {
        console.log(lines)
        console.log(fileMatch)
        startCommand = `touch ${fileMatch.at(1)};`
        filename = fileMatch.at(1)!;
    }

    const file = `${filename}.${langToExtension[language]}` // for eg. file.py
    const languageExecCommand = langToExecute[language]
    const writeCodeToFileCommand = `echo '${code}' > ${file};`
    const runCodeFileCommand = languageExecCommand + " " + file + ";"
    // const emptyFileCommand = `> ${file}`
    let command = startCommand + writeCodeToFileCommand + runCodeFileCommand;
    return command
}

const server = createServer(listener)
server.listen(5000, () => { console.log("server listening on 5000") });

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
