import { allowedLanguages } from "src/intefaces/allowedLanguages";

export const langToImage: Record<allowedLanguages, string> = {
    python: "python:latest",
    javascript: "node:latest",
    rust: "rust:latest",
    go: "golang:latest",
    typescript: "ts-image",
} as const

export const langToExtension: Record<allowedLanguages, string> = {
    python: ".py",
    javascript: ".js",
    rust: ".rs",
    go: ".go",
    typescript: ".ts"
} as const

export const langToExecute: Record<allowedLanguages, string> = {
    python: "python",
    javascript: "node",
    rust: "cargo",
    go: "go",
    typescript: "ts-node"
} as const

export const FILENAME = "main";