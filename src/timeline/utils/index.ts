export const isExtension = window.location.href.slice(0, 6) === 'vscode';
export const vscode = isExtension?(global as any).acquireVsCodeApi(): null;
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