// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { timeline } from "console";
import * as vscode from "vscode";
import { GitService } from "./gitService";
import { ColaroidNotebookPanel } from "./notebook";
import { ColaroidTimelinePanel } from "./timeline";
import { TimelinePanel } from "./timelinePanel";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let path = vscode.workspace.workspaceFolders[0].uri.path;

	let gitService = new GitService(path);

	//----------added-------------

	var curTimelinePanel = null;
	var curNotebook = null;

	let disposable = vscode.commands.registerCommand("colaroid.create", () => {
		// The code you place here will be executed every time your command is executed

		if(!curTimelinePanel) {
		curTimelinePanel = new TimelinePanel(context.extensionUri, path);

		curTimelinePanel.gitService = gitService;

		context.subscriptions.push(
	  		vscode.window.registerWebviewViewProvider(TimelinePanel.viewType, curTimelinePanel));
		}

		

		let message: string;
		if (vscode.workspace.workspaceFolders !== undefined || !curNotebook) {
			// let f = vscode.workspace.workspaceFolders[0].uri.fsPath ;

			message = `YOUR-EXTENSION: folder: ${path}`;

			vscode.window.showInformationMessage(message);
			curNotebook = new ColaroidNotebookPanel(undefined,context.extensionUri, path, curTimelinePanel);
			//curNotebook = ColaroidNotebookPanel.display(context.extensionUri, path, curTimelinePanel);
			curTimelinePanel.colaroidNotebookPanel = curNotebook;
			//curNotebook.timelinePanel = curTimelinePanel;
		} else {
			message =
				"YOUR-EXTENSION: Working folder not found, open a folder an try again";

			vscode.window.showErrorMessage(message);
		}
	});

	let reload = vscode.commands.registerCommand("colaroid.reload", () => {
			gitService.pullLatest();
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
	//---added
	const updatePanel = vscode.commands.registerCommand("colaroid.updateTimelinePanel", (data, branch) => {
        curTimelinePanel.updateTimeline(data, branch);
    });

	const removePanelButton = vscode.commands.registerCommand("colaroid.removePanelButton", (data) => {
        curTimelinePanel.removeButton(data);
    });

	const updateNotebook = vscode.commands.registerCommand("colaroid.revertSnapshot", (data) => {
		curNotebook.handleMessage(data);
	});

	const removeStudentButton = vscode.commands.registerCommand("colaroid.removeStudentButton", (data) => {
		curNotebook.handleMessage(data);
	});

	const addStudentButton = vscode.commands.registerCommand("colaroid.addStudentButton", (data) => {
		curNotebook.handleMessage(data);
	});

	const prevStep = vscode.commands.registerCommand("colaroid.prevStep", (data) => {
		curNotebook.handleMessage(data);
	});

	const nextStep = vscode.commands.registerCommand("colaroid.nextStep", (data) => {
		curNotebook.handleMessage(data);
	});

	//---
	context.subscriptions.push(disposable, reload, timelineHandler, updatePanel, updateNotebook,
		removePanelButton, removeStudentButton, addStudentButton, prevStep, nextStep
	);
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
