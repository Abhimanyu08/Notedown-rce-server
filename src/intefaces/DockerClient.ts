import { dockerFetchResult } from "src/utils/dockerOps"

export interface DockerClient {
    LIST_CONTAINERS: () => dockerFetchResult
    CREATE_CONTAINER: (imageName: string) => dockerFetchResult
    START_CONTAINER: (containerId: string) => dockerFetchResult
    PULL_IMAGE: (imageName: string) => dockerFetchResult
    CREATE_EXEC: (containerId: string, command: string) => dockerFetchResult
    START_EXEC: (execId: string) => dockerFetchResult
}
