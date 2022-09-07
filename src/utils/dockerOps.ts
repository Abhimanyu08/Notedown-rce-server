import { request } from "http";
import { RequestOptions } from "https";

interface dockerFetchArgs {
    opts: RequestOptions
    body?: Record<string, string | boolean | string[]>
}

export type dockerFetchResult = Promise<{ data?: string, dockerStatusCode?: number, error?: string }>

export function dockerFetch({ opts, body }: dockerFetchArgs): dockerFetchResult {
    return new Promise((resolve) => {
        let resData: string = "";
        const req = request(opts, (res) => {
            res.on("data", (chunk) => {
                resData += chunk.toString('utf-8');
            });
            res.on("error", (err) => {
                resolve({ error: err.message })
            });
            res.on("end", () => {
                const { statusCode } = res

                if (statusCode && statusCode >= 400) {
                    //in this case resData is actually the error message
                    resolve({ error: resData, dockerStatusCode: statusCode });
                    return
                }
                resolve({
                    data: resData,
                    dockerStatusCode: statusCode,
                })

            });
        });
        if (body)
            req.write(JSON.stringify(body));
        req.end();

    });
}
