// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { timeline } from "console";
import * as vscode from "vscode";
import { ColaroidNotebookPanel } from "./notebook";
import { ColaroidTimelinePanel } from "./timeline";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand("colaroid.create", () => {
		// The code you place here will be executed every time your command is executed

		let message: string;
		if (vscode.workspace.workspaceFolders !== undefined) {
			let path = vscode.workspace.workspaceFolders[0].uri.path;
			// let f = vscode.workspace.workspaceFolders[0].uri.fsPath ;

			message = `YOUR-EXTENSION: folder: ${path}`;

			vscode.window.showInformationMessage(message);
			ColaroidNotebookPanel.display(context.extensionUri, path);
		} else {
			message =
				"YOUR-EXTENSION: Working folder not found, open a folder an try again";

			vscode.window.showErrorMessage(message);
		}
	});

	let timelineHandler = vscode.commands.registerCommand("colaroid.timeline", () => {

		let message: string;
		message = `welcome to timeline view`;
		const editor = vscode.window.visibleTextEditors[0];
		decorate(editor);

		vscode.window.showInformationMessage(message);
		if (vscode.workspace.workspaceFolders !== undefined) {
			let path = vscode.workspace.workspaceFolders[0].uri.path;
			// let f = vscode.workspace.workspaceFolders[0].uri.fsPath ;

			message = `YOUR-EXTENSION: folder: ${path}`;

			vscode.window.showInformationMessage(message);
			ColaroidTimelinePanel.display(context.extensionUri, path);
		} else {
			message =
				"YOUR-EXTENSION: Working folder not found, open a folder an try again";

			vscode.window.showErrorMessage(message);
		}
	});

	context.subscriptions.push(disposable, timelineHandler);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('deactivate extension');
}

const ICON_URL =
  "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/svgs/solid/angle-double-up.svg";

const decorationType = vscode.window.createTextEditorDecorationType({
	gutterIconPath: vscode.Uri.parse(ICON_URL),
	gutterIconSize: "contain",
	overviewRulerColor: "rgb(246,232,154)",
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
  });

//   const TOUR_DECORATOR = vscode.window.createTextEditorDecorationType({
// 	gutterIconPath: vscode.Uri.parse(ICON_URL),
// 	gutterIconSize: "contain",
// 	overviewRulerColor: "rgb(246,232,154)",
// 	overviewRulerLane: vscode.OverviewRulerLane.Right,
// 	rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
//   });

function decorate(editor: vscode.TextEditor) {
	let sourceCode = editor.document.getText()
	let regex = /(console\.log)/
  
	let decorationsArray: vscode.DecorationOptions[] = []
  
	const sourceCodeArr = sourceCode.split('\n')
  
	for (let line = 0; line < sourceCodeArr.length; line++) {
	  let match = sourceCodeArr[line].match(regex)
  
	  if (match !== null && match.index !== undefined) {
		let range = new vscode.Range(
		  new vscode.Position(line, match.index),
		  new vscode.Position(line, match.index + match[1].length)
		)
  
		let decoration = { range }
  
		decorationsArray.push(decoration)
	  }
	}
  
	editor.setDecorations(decorationType, decorationsArray)
  }
