import { allowedLanguages } from "src/intefaces/allowedLanguages";
import { langToImage } from "./constants";

export function getCreateContainerReqBody(language: allowedLanguages): { Image: string; Tty: boolean; WorkingDir?: string; Cmd?: string } {
    switch (language) {

        case "python":
            return {
                "Image": langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            }
        case "javascript":
            return {
                "Image": langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            }
        case "rust":
            return {
                "Image": langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            }
        case "go":
            return {
                "Image": langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            }
        case "typescript":
            return {
                "Image": langToImage[language],
                "Tty": true,
                "WorkingDir": "/app",
            }
    }
}
