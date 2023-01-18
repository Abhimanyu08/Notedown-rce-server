export const langToImage = {
    python: "python:latest",
    javascript: "node:latest",
    rust: "rust:latest"
} as const

export const langToExtension = {
    python: ".py",
    javascript: ".js",
    rust: ".rs"
} as const

export const langToExecute = {
    python: "python",
    javascript: "node",
    rust: "cargo"
} as const

export const FILENAME = "main";