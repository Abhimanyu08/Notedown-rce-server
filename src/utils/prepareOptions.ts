import { OutgoingHttpHeaders } from "http2";
import { RequestOptions } from "https";
import { createReqWithSearchParams } from "./createReqWithSearchParams";

interface prepareOptionsArgs {
    method: "GET" | "POST"
    path: string
    headers?: OutgoingHttpHeaders
    queryOptions?: Record<string, string>
}
export function prepareOptions({ method, path, headers, queryOptions }: prepareOptionsArgs): RequestOptions {
    if (queryOptions) {
        path = createReqWithSearchParams(path, queryOptions)
    }
    return {
        hostname: process.env.DOCKER_HOSTNAME,
        port: process.env.DOCKER_PORT,
        method,
        path,
        ...(headers && {
            headers
        })
    };
}
