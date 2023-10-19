import { allowedLanguages } from "../intefaces/allowedLanguages";
import { FILENAME } from "./constants";

export function getIntialCommand(language: allowedLanguages) {
    switch (language) {
        case "python":
            // return `mkdir src;touch src/${FILENAME}.py`
            return ''

        case "javascript":
            // return `npm init -y;mkdir src;touch src/${FILENAME}.js`
            return ''

        case "rust":
            return "cargo new workdir"
        case "go":
            return "go mod init example/main"
    }
}

export function getRunCodeFileCommand(languauge: allowedLanguages, file?: string) {
    switch (languauge) {
        case "python":
            return `python ${file};`
        case "javascript":
            return `node ${file};`
        case "rust":
            return "cargo run";
        case "go":
            return "go run ."
    }

}