export const vscode = (global as any).acquireVsCodeApi();

export const getLanguage = (format) =>{
    let language = '';
    switch (format) {
        case "js":
            language = "javascript";
            break;
        case "html":
            language = "html";
            break;
        case "css":
            language = "css";
            break;
        case "ts":
            language = "typescript";
            break;
        default:
            language = "plain";
    }
    return language;
};