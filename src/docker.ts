import 'dotenv/config';
import { DockerClient } from './intefaces/DockerClient';
import { prepareOptions } from './utils/prepareOptions';
import { dockerFetch } from './utils/dockerOps';


export async function listContainers() {
    const opts = prepareOptions({ method: "GET", path: "/containers/json" });
    return dockerFetch({ opts });
}

export async function createContainer({ imageName }: { imageName: string; }): Promise<{ data?: { containerId: string; }; error?: string; }> {
    const opts = prepareOptions({ method: "POST", path: "/containers/create", headers: { "Content-Type": "application/json" } });
    let body = {
        "Image": imageName,
        "Tty": true,
    };
    let createContainerResp = await dockerFetch({ opts, body });
    if (!createContainerResp.error && createContainerResp.data) {
        const { data: dataString } = createContainerResp;
        const { Id } = JSON.parse(dataString);
        return { data: { containerId: Id } };
    }

    if (createContainerResp.dockerStatusCode === 404) {
        //error code 404 means there is no image named imageName. Therefore, we need to try pulling the image and creating the container once more
        const pullImageResp = await pullImage({ imageName });
        if (pullImageResp.error) {
            return { error: pullImageResp.error };
        }

        return createContainer({ imageName });
    }
    return { error: createContainerResp.error }
}

export async function startContainer({ containerId }: { containerId: string }): Promise<{ data?: string, error?: string }> {
    const opts = prepareOptions({ method: "POST", path: `/containers/${containerId}/start` });

    return dockerFetch({ opts })
}

export async function createExec({ containerId, command }: { containerId: string, command: string }): Promise<{
    data?: { execId: string }, error?: string
}> {

    const opts = prepareOptions({ method: "POST", path: `/containers/${containerId}/exec`, headers: { "Content-Type": "application/json" } });
    const body = {
        "AttachStdout": true,
        "AttachStderr": true,
        "Tty": true,
        "Cmd": ["sh", "-c", command]
    };
    const { data: createExecData, error } = await dockerFetch({ opts, body });
    if (error) {
        return { error }
    }
    if (!createExecData) {
        return { error: "No data" }
    }
    const { Id } = JSON.parse(createExecData);
    return { data: { execId: Id } }
}

export async function startExec({ execId }: { execId: string }):
    Promise<{ data?: { output: string }, error?: string }> {

    const opts = prepareOptions({ method: "POST", path: `/exec/${execId}/start`, headers: { "Content-Type": "application/json" } });
    const body = {
        "Detach": false,
        "Tty": true
    };

    const { data: startExecData, error } = await dockerFetch({ opts, body });
    if (error) {
        return { error }
    }
    if (startExecData === undefined) {
        return { error: "Not able to execute command" }
    }
    return { data: { output: startExecData } }
}
export async function createAndStartExec({ containerId, command }: { containerId: string, command: string }): ReturnType<typeof startExec> {
    const { data, error } = await createExec({ containerId, command });
    if (error) return { error }
    if (!data) return { error: "Couldn't create exec instance" }
    const executionOutput = startExec({ execId: data.execId });
    return executionOutput
}

export async function pullImage({ imageName }: { imageName: string }) {
    const opts = prepareOptions({ method: 'POST', path: "/images/create", queryOptions: { fromImage: imageName } });
    return dockerFetch({ opts });
}

