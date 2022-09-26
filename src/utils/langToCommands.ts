import { allowedLanguages } from "../intefaces/allowedLanguages";
import { FILENAME } from "./constants";

export function getIntialCommand(language: allowedLanguages) {
    switch (language) {
        case "python":
            return `mkdir src;touch src/${FILENAME}.py`

        case "javascript":
            return `npm init -y;mkdir src;touch src/${FILENAME}.js`

        case "rust":
            return "cargo new workdir"
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
    }

}