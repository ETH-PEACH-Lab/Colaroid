import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";


export const getWebviewOptions = (extensionUri: vscode.Uri): vscode.WebviewOptions => {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [
			vscode.Uri.file(path.join(extensionUri.path, "media")),
			vscode.Uri.file(path.join(extensionUri.path, "dist")),
			vscode.Uri.file(path.join(extensionUri.path, "node_modules")),
		],
	};
}

export const sleep = (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export const getNonce = () => {
	let text = "";
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export const readLocalDoc = async (dir: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		// check if .colaroid exists
		fs.readFile(`${dir}/.colaroid`, "utf8", (err, data) => {
			if (err) {
				resolve([]);
			} else {
				// parse JSON string to JSON object
				const doc = JSON.parse(data);
				resolve(doc);
			}
		});
	});
};

export const saveLocalDoc = async (dir: string, data: any): Promise<any> => {
	fs.writeFileSync(`${dir}/.colaroid`, JSON.stringify(data));
};