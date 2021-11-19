import * as vscode from "vscode";
import * as path from "path";
import { getNonce, getWebviewOptions, readLocalDoc } from "./utils";
import { GitService } from "./gitService";
import parseGitDiff from 'parse-git-diff';
const decorationType = vscode.window.createTextEditorDecorationType({
	backgroundColor: 'green',
	border: '2px solid white',
  });

export class ColaroidTimelinePanel {
    public static currentPanel: ColaroidTimelinePanel | undefined;
	public static readonly viewType = "colaroid";

	private readonly panel: vscode.WebviewPanel;
	private readonly extensionUri: vscode.Uri;
	private readonly path: string;
    private gitService;
    private content: any[] = [];
    private disposables: vscode.Disposable[] = [];
	
    public static display(extensionUri: vscode.Uri, path: string) {
        vscode.commands.executeCommand('workbench.action.editorLayoutTwoRows');

        if (ColaroidTimelinePanel.currentPanel) {
			ColaroidTimelinePanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
			return;
		}

        //Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ColaroidTimelinePanel.viewType,
			"Colaroid",
			vscode.ViewColumn.Beside,
			getWebviewOptions(extensionUri)
		);

		ColaroidTimelinePanel.currentPanel = new ColaroidTimelinePanel(
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
			ColaroidTimelinePanel.currentPanel = undefined;
		});

        // Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			this.handleMessage.bind(this),
			null,
			this.disposables
		);
    };

    private init = () => {
		this.panel.title = "Colaroid Timeline View";
		this.panel.webview.html = this.getHTMLForDoc(this.panel.webview);
    };

    private getHTMLForDoc(webview: vscode.Webview) {

		const scriptPathOnDisk = vscode.Uri.file(
			path.join(this.extensionUri.path, "dist", "timeline.js")
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
				<title>Colaroid Timeline View</title>
				<link href="${codiconsUri}" rel="stylesheet" />
				<link href="https://use.fontawesome.com/releases/v5.15.2/css/all.css" rel="stylesheet">
			</head>
			<body>
				<div id="root">
                <h1>Timeline View</h1>
                </div>
                <script type="text/javascript" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>
        `;
	};

    private initMessage = async () => {
        console.log(this.content)
        for (const data of this.content) {
			const { hash, message } = data;
			const result = await this.gitService.retrieveGitCommit(hash);
			const content = { message, ...result };
			this.panel.webview.postMessage({ command: "append", content });
		}
    };

    private handleMessage = async (message) => {
        console.log(message)
        if (message.command === "ready") {
            this.initMessage();
        }
        if (message.command === "revert snapshot") {
			await this.gitService.revertGit(message.id);
			if(message.pid) {
				const editors = vscode.window.visibleTextEditors;
				editors.forEach(editor => {
					this.clearDecorations(editor);
					this.renderDiff(editor, message.pid, message.id);
				});
			}
		}
    };

	private renderDiff = async (editor, hashA, hashB) => {
		const fileName = (editor.document.fileName).replace(this.path + '/', '');
		if(fileName && fileName!==''){
			const result = await this.gitService.generateDiff(hashA, hashB, fileName);
			const lines = this.parseDiffInfo(result);
			this.renderDecorations(lines, editor);
		}
	}

	private parseDiffInfo = (result: string) => {
		const parsedInfo = parseGitDiff(result);
		const filteredbyFiles = parsedInfo.files.filter(e=>e.type==="ChangedFile");
		let lines = [];
		if(filteredbyFiles.length >=0) {
			const chunks = filteredbyFiles[0].chunks;
			chunks.forEach(chunk => {
				const changes = chunk.changes;
				const addChanges = changes.filter(c=>c.type === 'AddedLine');
				addChanges.forEach(change => {
					lines.push(change['lineAfter']);
				});
			});
		}
		return lines;
	};

	private renderDecorations = (lines: number[], editor) => {
		let decorationsArray: vscode.DecorationOptions[] = [];
		let sourceCode = editor.document.getText();
		const sourceCodeArr = sourceCode.split('\n');
		lines.forEach(line => {
			let range = new vscode.Range(
				new vscode.Position(line - 1, 0),
				new vscode.Position(line - 1, sourceCodeArr[line-1]?.length)
			);
			let decoration = { range };
			  decorationsArray.push(decoration);
		});
		editor.setDecorations(decorationType, decorationsArray);
		//TODO: properly remove decorations
		//TODO: disappear when switching files
		//TODO: rerender when switching tabs or opening new files
	};

	private clearDecorations = (editor: vscode.TextEditor) => {
		editor.setDecorations(decorationType, []);
	  }
}