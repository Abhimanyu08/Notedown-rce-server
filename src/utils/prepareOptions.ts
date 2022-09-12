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
        hostname: '127.0.0.1',
        port: 2375,
        method,
        path,
        ...(headers && {
            headers
        })
    };
}
