import * as vscode from "vscode";
import * as path from "path";
import { GitService } from "./gitService";
import { getNonce, getWebviewOptions, readLocalDoc, saveLocalDoc, saveState } from "./utils";

export class ColaroidNotebookPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */

	public static currentPanel: ColaroidNotebookPanel | undefined;
	public static readonly viewType = "colaroid";

	private readonly panel: vscode.WebviewPanel;
	private readonly extensionUri: vscode.Uri;
	private readonly path: string;
	private gitService;
	private content: any[] = [];
	private disposables: vscode.Disposable[] = [];

	public static display(extensionUri: vscode.Uri, path: string) {
		// If we already have a panel, show it
		if (ColaroidNotebookPanel.currentPanel) {
			ColaroidNotebookPanel.currentPanel.panel.reveal(vscode.ViewColumn.Two);
			return;
		}

		//Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ColaroidNotebookPanel.viewType,
			"Colaroid",
			vscode.ViewColumn.Two,
			getWebviewOptions(extensionUri)
		);

		ColaroidNotebookPanel.currentPanel = new ColaroidNotebookPanel(
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
		this.panel.onDidDispose(()=>{
			this.disposables;
			ColaroidNotebookPanel.currentPanel = undefined;
		});

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
	}

	private async initMessage(){
		for (const data of this.content) {
			const { hash, message, recording } = data;
			const result = await this.gitService.retrieveGitCommit(hash);
			const content = { message, ...result, recording };
			this.panel.webview.postMessage({ command: "append", content });
		}
	}

	private async appendCell(data: any) {
		// append the last cell
		const { hash, message, recording } = data;
		const result = await this.gitService.retrieveGitCommit(hash);
		const content = { message, ...result, recording };
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
		const codiconsUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.path, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')));


		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
				<title>Colaroid Notebook</title>
				<base href="${uriBase}">
				<link href="${codiconsUri}" rel="stylesheet" />
				<link href="https://use.fontawesome.com/releases/v5.15.2/css/all.css" rel="stylesheet">
			</head>
			<body>
				<div id="root"></div>
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
		if (message.command === "ready") {
			this.initMessage();
		}
		if (message.command === "add") {
			this.gitService.createGitCommit(message.content).then((result) => {
				const data = {
					message: message.content,
					hash: result.commit
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
			}
		if (message.command === "revert snapshot") {
			this.gitService.revertGit(message.id);
		}
		if (message.command === "edit snapshot") {
			this.gitService.createGitCommit('edit snapshot').then((result) => {
				if(result.commit !== ''){
					let content = this.content[message.index];
					content.hash = result.commit;
					this.content[message.index] = content;
					saveLocalDoc(this.path, this.content);
					this.refresh();
				}
			});	
		}
		if (message.command === "save recording") {
			console.log('save recording')
			const index = this.content.findIndex((item, idx) => {
				return item.hash === message.id;
			});
			this.content[index].recording = message.content;
			saveLocalDoc(this.path, this.content);
		}
		if (message.command === "export state") {
			console.log('export state')
			saveState(path.join(this.extensionUri.path, "dist", "state", "state.json"), message.content)
		}
	}
}





