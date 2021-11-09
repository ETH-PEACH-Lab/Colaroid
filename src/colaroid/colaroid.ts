import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
import { GitService } from "./gitService";

const delay = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export class ColaroidPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */

	public static currentPanel: ColaroidPanel | undefined;
	public static readonly viewType = "colaroid";

	private readonly panel: vscode.WebviewPanel;
	private readonly extensionUri: vscode.Uri;
	private readonly path: string;
	private gitService;
	private content: any[] = [];
	private currentVisible: boolean = true;
	private currentViewColumn: any = vscode.ViewColumn.One;
	private disposables: vscode.Disposable[] = [];

	public static display(extensionUri: vscode.Uri, path: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (ColaroidPanel.currentPanel) {
			ColaroidPanel.currentPanel.panel.reveal(column);
			return;
		}

		//Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ColaroidPanel.viewType,
			"Colaroid",
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri)
		);

		ColaroidPanel.currentPanel = new ColaroidPanel(
			panel,
			extensionUri,
			path
		);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		path: string
	) {
		this.panel = panel;
		this.extensionUri = extensionUri;
		this.path = path;
		this.gitService = new GitService(this.path);

		readLocalDoc(this.path).then((data) => {
			this.content = data;
			this.init();
		});

		// Listen for when the panel is disposed
		// This happens when the user closes the panel
		// this.panel.onDidDispose(()=>this.disposables())

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			(e) => {
				if (this.panel.visible && !this.currentVisible) {
					this.init();
				}
				if (this.panel.viewColumn !== this.currentViewColumn) {
					this.init();
				}
				this.currentVisible = this.panel.visible;
				this.currentViewColumn = this.panel.viewColumn;
			},
			null,
			this.disposables
		);

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			this.handleMessage.bind(this),
			null,
			this.disposables
		);
	}

	private async init() {
		// init the notebook
		this.panel.title = "New Notebook";
		this.panel.webview.html = this.getHTMLForDoc(this.panel.webview);
		// need to wait sometime to load react component;
		// TODO: send a signal from frontend to backend, indicating that the frontend is ready
		await delay(5000);
		for (const data of this.content) {
			const { hash, message } = data;
			const result = await this.gitService.retrieveGitCommit(hash);
			const content = { message, ...result };
			this.panel.webview.postMessage({ command: "append", content });
		}
	}

	private async appendCell(data: any) {
		// append the last cell
		const { hash, message } = data;
		const result = await this.gitService.retrieveGitCommit(hash);
		const content = { message, ...result };
		this.panel.webview.postMessage({ command: "append", content });
	}
	// this sends command to the frontend to clean the current rendering and update the views
	private async refresh() {
		this.panel.webview.postMessage({ command: "clean", content: {} });
		for (const data of this.content) {
			const { hash, message } = data;
			const result = await this.gitService.retrieveGitCommit(hash);
			const content = { message, ...result };
			this.panel.webview.postMessage({ command: "append", content });
		}
	}

	private getHTMLForDoc(webview: vscode.Webview) {

		const scriptPathOnDisk = vscode.Uri.file(
			path.join(this.extensionUri.path, "dist", "notebook.js")
		);

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		const uriBase = webview.asWebviewUri(
			vscode.Uri.file(`${path.dirname(scriptPathOnDisk.fsPath)}/`)
		);

		const stylesPathMainPath = vscode.Uri.file(
			path.join(this.extensionUri.path, "dist/notebook", "index.css")
		);

		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
				<title>Colaroid Notebook</title>
				<base href="${uriBase}">
				<link href="${stylesMainUri}" rel="stylesheet" />
				<link href="https://use.fontawesome.com/releases/v5.15.2/css/all.css" rel="stylesheet">
			</head>
			<body>
				<div id="root"></div>
				<h1>Test</h1>
				<script type="text/javascript">
					function resolvePath(relativePath) {
						if (relativePath && relativePath[0] == '.' && relativePath[1]!== '.') {
							return "${uriBase}" + relativePath.substring(1);
						}
						 rerturn "${uriBase}" + relativePath;
					}
				</script>
				<script type="text/javascript" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>
        `;
	}

	private handleMessage(message) {
		console.log('got message');
		console.log(message.command)
		if (message.command === "add") {
			this.gitService.createGitCommit(message.content).then((result) => {
				const data = {
					message: message.content,
					hash: result.commit,
				};
				this.content.push(data);
				saveLocalDoc(this.path, this.content);
				this.appendCell(data);
			});
		}
		if (message.command === "revise message") {
			console.log('revise message received')
			const index = this.content.findIndex((item, idx) => {
				return item.hash === message.id;
			});
			this.content[index].message = message.content;
			saveLocalDoc(this.path, this.content);
		}
		if (message.command === "remove cell") {
			const index = this.content.findIndex((item, idx) => {
				return item.hash === message.id;
			});
			this.content.splice(index, 1);
			saveLocalDoc(this.path, this.content);
		}

		if (message.command === "move up cell") {
			const index = this.content.findIndex((item, idx) => {
				return item.hash === message.id;
			});
			this.content.splice(
				index - 1,
				2,
				this.content[index],
				this.content[index - 1]
			);
			saveLocalDoc(this.path, this.content);
			this.refresh();
		}
		if (message.command === "move down cell") {
			const index = this.content.findIndex((item, idx) => {
				return item.hash === message.id;
			});
			this.content.splice(
				index,
				2,
				this.content[index + 1],
				this.content[index]
			);
			saveLocalDoc(this.path, this.content);
			this.refresh();
		}
		if (message.command === "revert snapshot") {
			this.gitService.revertGit(message.id);
		}
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [
			vscode.Uri.file(path.join(extensionUri.path, "media")),
			vscode.Uri.file(path.join(extensionUri.path, "dist")),
		],
	};
}

function getNonce() {
	let text = "";
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

const readLocalDoc = async (dir: string): Promise<any> => {
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

const saveLocalDoc = async (dir: string, data: any): Promise<any> => {
	fs.writeFileSync(`${dir}/.colaroid`, JSON.stringify(data));
};
