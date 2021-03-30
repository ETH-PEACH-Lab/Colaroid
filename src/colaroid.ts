import * as vscode from "vscode";
import * as fs from "fs";
import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";

export class ColaroidPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */

	public static currentPanel: ColaroidPanel | undefined;
	public static readonly viewType = "colaroid";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _path: string;
	private _content: any[] = [];
	private _currentVisible: boolean = true;
	private _currentViewColumn: any = vscode.ViewColumn.One;
	private _disposables: vscode.Disposable[] = [];

	public static display(extensionUri: vscode.Uri, path: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (ColaroidPanel.currentPanel) {
			ColaroidPanel.currentPanel._panel.reveal(column);
			return;
		}

		//Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ColaroidPanel.viewType,
			"Colaroid",
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri)
		);

		ColaroidPanel.currentPanel = new ColaroidPanel(panel, extensionUri, path);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		path: string
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._path = path;
		readLocalDoc(this._path).then((data) => {
			this._content = data;
			this._init();
		});

		// Listen for when the panel is disposed
		// This happens when the user closes the panel
		// this._panel.onDidDispose(()=>this.disposables())

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			(e) => {
				if (this._panel.visible && !this._currentVisible) {
					this._init();
				}
				if (this._panel.viewColumn !== this._currentViewColumn) {
					this._init();
				}
				this._currentVisible = this._panel.visible;
				this._currentViewColumn = this._panel.viewColumn;
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			(message) => {
				console.log(`get message ${message.content}`);
				if (message.command === "add") {
					createGitCommit(path, message.content).then((result) => {
						const data = {message: message.content, hash: result.commit};
						this._content.push(data);
						saveLocalDoc(this._path, this._content);
						this._update(data);
					});
				}
				if (message.command === "revise message") {
					this._content[message.index].message = message.content;
					saveLocalDoc(this._path, this._content);
				}
				if (message.command === "remove cell") {
					this._content.splice(message.index, 1);
					saveLocalDoc(this._path, this._content);
				}
			},
			null,
			this._disposables
		);
	}

	private async _init() {
		// init the notebook
		console.log("init!");

		this._panel.title = "New Notebook";
		this._panel.webview.html = this._getHTMLForDoc(this._panel.webview);
		for (const data of this._content) {
			const {hash, message} = data;
			const result = await retriveGitCommit(this._path, hash);
			const content = { message, ...result };
			this._panel.webview.postMessage({ command: "update", content });
	
		}
	}

	private _update(data: any){
		console.log('update!');	
		// append the last cell
		const { hash, message } = data;
		retriveGitCommit(this._path, hash).then((result) => {
			const content = { message, ...result };
			this._panel.webview.postMessage({ command: "update", content });
		});
	}

	private _getHTMLForDoc(webview: vscode.Webview) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(
			this._extensionUri,
			"media",
			"main.js"
		);

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		const stylesPathMainPath = vscode.Uri.joinPath(
			this._extensionUri,
			"media",
			"style.css"
		);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();
		return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
				<script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js" integrity="sha512-L03kznCrNOfVxOUovR6ESfCz9Gfny7gihUX/huVbQB9zjODtYpxaVtIaAkpetoiyV2eqWbvxMH9fiSv5enX7bw==" crossorigin="anonymous"></script>
				<script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.23.0/min/vs/loader.min.js" integrity="sha512-+8+MX2hyUZxaUfMJT0ew+rPsrTGiTmCg8oksa6uVE/ZlR/g3SJtyozqcqDGkw/W785xYAvcx1LxXPP+ywD0SNw==" crossorigin="anonymous"></script>
				<link href="https://use.fontawesome.com/releases/v5.15.2/css/all.css" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
                <title>Colaroid</title>
            </head>
            <body>
			<header>
				<textarea placeholder="instructions here..." id="snapshot-input"></textarea>
				<button id="snapshot-btn"><i class="fa fa-plus"></i>
				Insert a Snapshot
				</button>
			</header>
                <article id="notebook-container" class="markdown-body">
                </article>
				<article id="start-container">
				<h1>Welcome to Colaroid!</h1>
				<p>Colaroid is designed for "literate programming" -- it allows you to embed code in a document to create computational narratives. It stands out from other computational notebooks as it is created for documenting code evolutions. Colaroid can be used for a variety of programming tasks where storytelling matters. </p>
				<p>Please start by inserting a snapshot.</p>
				</article>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
        </html>
        `;
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
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

const isNewGit = async (dir: string): Promise<any> => {

};
const retriveGitCommit = async (dir: string, hash: string): Promise<any> => {
	const options: Partial<SimpleGitOptions> = {
		baseDir: dir,
		binary: "git",
		maxConcurrentProcesses: 6,
	};

	// when setting all options in a single object
	const git: SimpleGit = simpleGit(options);

	const hashResult = await git.catFile(["-p", hash]);
	const treeMatch = hashResult.match(/tree (.*)/);
	const treeID = treeMatch ? treeMatch[1] : "";
	const treeResult = await git.catFile(["-p", treeID]);
	const blobMatch = treeResult.match(/blob (.*)\t[^.]/);
	const blobID = blobMatch ? blobMatch[1] : "";
	const formatMatch = treeResult.match(/blob .*\t[^.].*\.(.*)/);
	const format = formatMatch ? formatMatch[1] : "";
	const content = await git.catFile(["-p", blobID]);
	const result = { hash, content, format };
	return result;
};
const pullGitData = async (dir: string): Promise<any> => {
	const result = [] as any[];
	const options: Partial<SimpleGitOptions> = {
		baseDir: dir,
		binary: "git",
		maxConcurrentProcesses: 6,
	};

	// when setting all options in a single object
	const git: SimpleGit = simpleGit(options);

	const logResult = await git.log();
	const log = logResult.all;

	for (let i = log.length - 1; i >= 0; i--) {
		const { message, hash, body } = log[i];
		const hashResult = await git.catFile(["-p", hash]);
		const treeMatch = hashResult.match(/tree (.*)/);
		const treeID = treeMatch ? treeMatch[1] : "";
		const treeResult = await git.catFile(["-p", treeID]);
		const blobMatch = treeResult.match(/blob (.*)\t[^.]/);
		const blobID = blobMatch ? blobMatch[1] : "";
		const formatMatch = treeResult.match(/\.(.*)\n/);
		const format = formatMatch ? formatMatch[1] : "";
		const content = await git.catFile(["-p", blobID]);
		const element = { hash, message, content, format, body };
		result.push(element);
	}
	return result;
};

const createGitCommit = async (dir: string, message: string): Promise<any> => {
	const options: Partial<SimpleGitOptions> = {
		baseDir: dir,
		binary: "git",
		maxConcurrentProcesses: 6,
	};
	const git: SimpleGit = simpleGit(options);
	const addResult = await git.add(["--all"]);
	const commitResult = await git.commit(message);
	return commitResult;
};