export const langToImage = {
    python: "python:latest",
    javascript: "node:latest",
    rust: "rust:latest",
    go: "golang:latest"
} as const

export const langToExtension = {
    python: ".py",
    javascript: ".js",
    rust: ".rs",
    go: ".go"
} as const

export const langToExecute = {
    python: "python",
    javascript: "node",
    rust: "cargo",
    go: "go"
} as const

export const FILENAME = "main";