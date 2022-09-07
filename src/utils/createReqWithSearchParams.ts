export function createReqWithSearchParams(path: string, options: Record<string, string>): string {
    let s = `${path}?`;
    for (let [key, value] of Object.entries(options)) {
        s = s.concat(`${key}=${value}`);

    }
    return s;
}
