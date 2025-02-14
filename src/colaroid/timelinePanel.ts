//https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/src/extension.ts

/*

Notes: 
- elementId for step-container make it required unique??
- change names of save and commit button to student and master button
- for the student and commit buttons use id instead of title for id
- think about making two classes for the lines, one for within step lines and one for inbetween steps lines
- state logic might be faulty if notebookpanel and timelinepanel are closed seperatly -> maybe if one closes close the other one aswell
- Reset function (reset the studentbranch)
- add codicon styles
- add  support for the author to change the order of the mastersteps and add steps not just at the end.
- mixed  solved, solve, verify, verified in ts and js file maybe only use verify/verified
- if u change step also change activly the step of popupwindow(maybe display the step in the popup)
- due to changes in git(>2.28) the default branch name is main not master 
- do the recordings in master stil work?
- what happens if you define name that is longer than max # of charaters
- do not allow more saves when step verfied
- when in master hash and using save-btn created hash will just be the master commit!!!
*/

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getNonce } from "./utils";
import { GitService } from "./gitService";
import { ColaroidNotebookPanel } from "./notebook"
import { testSave } from "./llmManager/copilotManager";
import { error } from "console";
import { sleep } from "./utils"
import { setPriority } from "os";


export class TimelinePanel implements vscode.WebviewViewProvider {
    private panel?: vscode.WebviewView;
    private readonly extensionUri: vscode.Uri;
    public gitService: GitService;
    private colaroidNotebookPanel: ColaroidNotebookPanel;
    private hideDecoration: vscode.TextEditorDecorationType | null = null;
    private activeHash: string = undefined
    private showSolution: Boolean = false;

    //TODO: instead of having just a index (starts from 0) give each step a name 
    private studentStepMap = new Map<number, string[]>();
    private masterStepMap = new Map<number, string>();

    public static readonly viewType = "colaroid.timelinePanel";

    // Static method to create or show the panel (TODO: should this method be static?)
    public resolveWebviewView(webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,) {

        this.panel = webviewView;

        webviewView.webview.options =
        {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.extensionUri.fsPath, "src/colaroid/views")),
                vscode.Uri.file(path.join(this.extensionUri.fsPath, "media")),
                vscode.Uri.file(path.join(this.extensionUri.fsPath, "node_modules/showdown")),
                vscode.Uri.file(path.join(this.extensionUri.fsPath, "dist")),
            ],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            //console.log("THIS IS SEND ", message.id , " ", message.command)
            switch (message.command) {
                case "revert snapshot":
                    await this.colaroidNotebookPanel.handleMessage(message)
                    if(this.containsHash(message.id, "master")) {
                        this.updateActiveStep(this.colaroidNotebookPanel.getIndex())
                    }
                    this.updateActiveHash(message.id);
                    break;
                case "save":
                    this.saveStep();
                    break;
                case "nextStep":
                    await this.colaroidNotebookPanel.handleMessage(message)
                    this.updateActiveStep(this.colaroidNotebookPanel.getIndex())
                    break;
                case "prevStep":
                    await this.colaroidNotebookPanel.handleMessage(message)
                    this.updateActiveStep(this.colaroidNotebookPanel.getIndex())
                    break;
                case "remove student button":
                    const step = this.getStepfromHash(message.id, "student");
                    this.removeHash(step, message.id);
                    await this.colaroidNotebookPanel.handleMessage(message);
                    this.activeHash = undefined;
                    break;
                case "display step":
                    this.displayStep();
                    break;
                case "render hash":
                    this.singleRendering(message.hash);
                    break;
                case "compare":
                    this.doubleRendering(message.hash);
                    break;
                case "verify":
                    this.colaroidNotebookPanel.stepSolved(message.step);
                    break;
                case "reset solved":
                    this.colaroidNotebookPanel.resetSolved(message.step);
                    break;
                case "reset from":
                    this.colaroidNotebookPanel.resetFrom(message.hash);
                    break
                case "open author":
                    this.displayStep(true)
                    break;
                case "take master":
                    await this.createSaveFromOld(message.step, "endpoint", message.hash);
                    await this.createSaveFromOld(message.step + 1, "master", undefined);
                    break
                case "take student":
                    await this.createSaveFromOld(message.step, "endpoint", message.hash);
                    await this.createSaveFromOld(message.step + 1, "student", message.hash);
                    break
                case "take nothing":
                    await this.createSaveFromOld(message.step, "endpoint", message.hash);
                    break
                case "change name":
                    this.colaroidNotebookPanel.changeName(message.name, message.hash, message.branch);
                    break
                case "show solution":
                    this.hideDecoration.dispose();
                    this.hideDecoration = null;
                    this.showSolution = true;
                    break
                case "llm call":
                    var text;
                    if (this.activeHash === undefined || this.containsHash(this.activeHash, "master")) {
                        text = "Click on your savepoint that you want to test/get a hint on"
                    } else {
                        text = await this.llmTestSave(this.activeHash, message.type);
                    }
                    if (this.panel) {
                        this.panel.webview.postMessage({
                            command: "llm response",
                            text: text
                        });
                    }
                    break
            }
        });

    }

    public setNotebook(colaroidNotebookPanel: ColaroidNotebookPanel) {
        this.colaroidNotebookPanel = colaroidNotebookPanel;
        this.initTimelinePanel();
    }

    private async initTimelinePanel() {
        const masterData = this.colaroidNotebookPanel.getContent();
        const studentData = this.colaroidNotebookPanel.getStudentHashes();
        console.log("HERE!: " + masterData.length + " " + studentData.length)
        for (const data of masterData) {
            this.updateTimeline(data, "master");
        }
        console.log("mastersteps: " + this.masterStepMap.size)
        for (const data of studentData) {
            this.updateTimeline(data, "student");
        }
        if(studentData.length === 0) {
            const data = {
                command: "save",
                hash: await this.gitService.getFirstCommit(),
                step: 0,
                from: undefined,
                name: "Startpoint"
            }
            await this.colaroidNotebookPanel.handleMessage(data)
            data.command = "addStudent"
            if (this.panel) {
                this.panel.webview.postMessage(data);
            }
            this.addHash(0, data.hash)
        }
    }

    public updateTimeline(data: any, branch: string) {
        if (this.panel && branch == "master") {
            const keys = [...this.masterStepMap.keys()]
            var step = 0;
            if (keys.length === 0) {
                this.masterStepMap.set(0, data.hash);
                this.studentStepMap.set(0, []);
            } else {
                const max = Math.max(...keys);
                this.masterStepMap.set(max + 1, data.hash);
                this.studentStepMap.set(max + 1, []);
                step = max + 1;
            }

            const name = data.name ? data.name : "Step " + (step+1);

            this.panel.webview.postMessage({
                command: "updateTimelineMaster",
                hash: data.hash,
                step: step,
                solved: data.solved,
                name: name
            });
        } else if (this.panel && branch === "student") {
            //is only called at the beginning when notebook is opened, for adding while open refer to saveStep
            this.panel.webview.postMessage({
                command: "updateTimelineStudent",
                hash: data.hash,
                step: data.step,
                from: data.from,
                name: data.name
            });
            this.addHash(data.step, data.hash);
        } else {
            console.warn("TimelinePanel is not active, cannot update timeline.");
        }
    }

    //this is only if master branch button is deleted
    public removeButton(data: any) {
        if (this.panel) {
            const index = this.getStepfromHash(data.id, "master")
            this.deleteStep(this.masterStepMap, index)
            this.deleteStep(this.studentStepMap, index)
            this.panel.webview.postMessage({
                command: "removeButton",
                step: index,
            });
        } else {
            console.warn("TimelinePanel is not active, cannot update timeline.");
        }
    }

    public async saveStep() {
        if (!this.colaroidNotebookPanel) {
            console.log("colaroidNotebookPanel does not exist")
            return
        }
        const index = this.colaroidNotebookPanel.getIndex();
        // not sure if check is needed 
        if (index < 0) {
            vscode.window.showInformationMessage("No new cell is added.");
            return;
        }
        await vscode.commands.executeCommand("workbench.action.files.saveAll");
        this.gitService.createGitCommitStudent().then(async (result) => {
            const data = {
                command: "save",
                hash: result.commit,
                step: index,
                from: undefined,
                name: `Save ${index + 1}.${this.studentStepMap.get(index).length + 1}`
            };
            // adds student button
            await this.colaroidNotebookPanel.handleMessage(data)
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: "addStudent",
                    hash: data.hash,
                    step: data.step,
                    from: data.from,
                    name: data.name
                });
            }
            this.addHash(index, data.hash)
        });
    }

    /* three cases:
        1: takes old master solution into new step when verfied (next Step, master, undefined)
        2: takes verfied save into next step when verified (next Step, student, sel save/last save from ver step)
        3: makes endpoint selected save when verified (ver step, endpoint, sel save)
            */
    private async createSaveFromOld(step: number, from: string, hash: string) {
        var name = `Save ${step+1}.1`
        if (from === "master") {
            hash = this.masterStepMap.get(step - 1);
            name = `Save ${step+1}.1`;
        } else if (from === "endpoint") {
            name = `Solved ${step+1}`;
        } else if (from !== "student") {
            throw new Error("createSaveFromOld: from has invalid string")
        }
        await this.gitService.takeOldCommit(hash).then(async (result) => {
            const data = {
                command: "save",
                hash: result.commit,
                step: step,
                from: from,
                name: name
            };
            // adds student button
            await this.colaroidNotebookPanel.handleMessage(data)
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: "addStudent",
                    hash: data.hash,
                    step: step,
                    from: from,
                    name: name
                });
            }
            this.addHash(step, data.hash)
        })
    }

    private updateActiveStep(step: number) {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: "update active step",
                step: step,
                content: this.colaroidNotebookPanel.getContent(step).message
            });
        }
    }

    public async updateActiveHash(hash: string) {
        this.showSolution = false;
        this.activeHash = hash;
        this.hide(undefined);
        if (this.panel) {
            this.panel.webview.postMessage({
                command: "update active hash",
                hash: hash
            });
        }
    }

    private hide(editors: readonly vscode.TextEditor[]) {
        if (this.showSolution) return
        if (this.containsHash(this.activeHash, "master")) {
            if (!editors) {
                editors = [...vscode.window.visibleTextEditors];
            }

            for (const editor of editors) {
                if (vscode.workspace.getWorkspaceFolder(editor.document.uri)) {
                    if (this.hideDecoration) {
                        this.hideDecoration.dispose();
                    }

                    this.hideDecoration = vscode.window.createTextEditorDecorationType({
                        opacity: "0",
                    });

                    const entireRange = new vscode.Range(
                        new vscode.Position(0, 0),
                        editor.document.lineAt(editor.document.lineCount - 1).range.end
                    );
                    editor.setDecorations(this.hideDecoration, [entireRange]);
                }
            }
        } else if (this.containsHash(this.activeHash, "student")) {
            if (this.hideDecoration) {
                this.hideDecoration.dispose();
                this.hideDecoration = null;
            }
        }
    }

    public async clearView() {
        this.studentStepMap.clear();
        this.masterStepMap.clear();
        if (this.panel) {
            this.panel.webview.postMessage({
                command: "clear view",
            });
        }
        await new Promise<void>((resolve) => {
            const disposable = this.panel.webview.onDidReceiveMessage((message) => {
                if (message.command === "view is clear") {
                    resolve();
                    disposable.dispose();
                }
            });
        });
    }

    private displayStep(authorMode: Boolean = false) {
        this.colaroidNotebookPanel.display(this.extensionUri, authorMode);
    }

    private async singleRendering(hash: string) {
        const result = { ...await this.gitService.retrieveGitCommit(hash) };
        const html = this.replaceChars(this.processDocument(result))
        const preview = vscode.window.createWebviewPanel(
            ColaroidNotebookPanel.viewType,
            "Preview",
            vscode.ViewColumn.Two,
            {enableScripts: true,}
        );

        preview.webview.html = `<iframe srcdoc="${html}" style="width:100vw; height:100vh; border:none; background:white"></iframe>`;
    }

    private async doubleRendering(hash: string) {
        const studentResult = { ...await this.gitService.retrieveGitCommit(hash) };
        //TODO: what if activeHash is master?
        const step = this.getStepfromHash(hash, "student");
        const masterHash = this.masterStepMap.get(step);
        const masterResult = { ...await this.gitService.retrieveGitCommit(masterHash) };
        //TODO: is replace really needed
        const studentHtml = (this.replaceChars(this.processDocument(studentResult)))
        const masterHtml = (this.replaceChars(this.processDocument(masterResult)))
        const preview = vscode.window.createWebviewPanel(
            ColaroidNotebookPanel.viewType,
            "Preview",
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.extensionUri.fsPath, "src/colaroid/views")),
                ],
            }
        );

        const scriptUri = preview.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, "src/colaroid/views", "compareEditor.js")));
        const styleUri = preview.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, "src/colaroid/views", "compareEditor.css")));

        const html = `<!DOCTYPE html>
		<html lang="en">
			<head>
                 <style>
                body {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                    gap: 15px;
                }
                iframe {
                    border: 1px solid #ccc;
                    flex: 1;
                    background: white;
                }
                html, body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    padding-left: 10px;
                    padding-right: 10px;
                    padding-top: 5px;
                }
                .iframe-container {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    resize: both;
                    overflow: auto;
                }
                .title {
                    text-align: center;
                    font-weight: bold;
                }

                #render-container {
                    display:flex;
                    flex-direction:row;
                    gap: 15px;
                }

                #code-title {
                    display:flex;
                    flex-direction:row;
                    justify-content:flex-end;
                    padding-bottom:3px;
                }

            </style>
             <link rel="stylesheet" href="${styleUri}">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs/loader.js"></script>
            <script src="${scriptUri}"></script>
			</head>
			<body>
            <div class="btn-container">
                <button id="renderButton" class="active" onClick="mode('render')">Render</button>
                <button id="codeButton" onClick="mode('code')">Code</button>
            </div>
                <div id="render-container">
                <div class=iframe-container>
                <div class="title">Student</div>
                <iframe srcdoc="${studentHtml}"></iframe>
                </div>
                <div class=iframe-container>
                <div class="title">Master</div>
                <iframe srcdoc="${masterHtml}"></iframe>
                </div>
                </div>
                <div id="code-container">
                    <div id="code-title">
                        <div class="title" style="width:40vw;">Student</div>
                        <div class="title" style="width:40vw;">Master</div>
                    </div>
                </div>
                <script defer>
                function mode(mode) {  
                    const renderButton = document.getElementById("renderButton");
                    const codeButton = document.getElementById("codeButton");
                    const codeContainer = document.getElementById("code-container")
                    const renderContainer = document.getElementById("render-container")
                    if(mode === "render") {
                        codeContainer.style.display = "none"
                        renderContainer.style.display = "flex"
                        renderButton.classList.add("active");
                        codeButton.classList.remove("active");
                    } else if(mode === "code") {
                        renderContainer.style.display = "none"
                        codeContainer.style.display = "flex"
                        renderButton.classList.remove("active");
                        codeButton.classList.add("active");
                     }
                }

                require(["vs/editor/editor.main"] , function() {
                    const container = document.getElementById("code-container")
                    compareEditor(${JSON.stringify(studentResult).replace(/<\/script>/g, '<\\/script>')},${JSON.stringify(masterResult).replace(/<\/script>/g, '<\\/script>')},container);
                });
                </script>
			</body>
		</html>
        `;

        preview.webview.html = html;
    }


    private async llmTestSave(hash: string, type: string): Promise<string> {
        const studentResult = { ...await this.gitService.retrieveGitCommit(hash) };
        //TODO: what if activeHash is master?
        const step = this.getStepfromHash(hash, "student");
        const masterHash = this.masterStepMap.get(step);
        const masterResult = { ...await this.gitService.retrieveGitCommit(masterHash) };
        //TODO: is replace really needed
        const studentHtml = this.processDocument(studentResult);
        const masterHtml = this.processDocument(masterResult);

        const response = await testSave(masterHtml, studentHtml, type);
        return response;
    }

    public constructor(private context: vscode.ExtensionContext, private path: string) {
        this.extensionUri = context.extensionUri;

        // Handle when the active editor changes
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    this.hide([editor]);
                }
            })
        );

        // Handle when the visible editors change
        context.subscriptions.push(
            vscode.window.onDidChangeVisibleTextEditors((editors) => {
                this.hide(editors);
            })
        );
    }

    // Generate the HTML content for the webview
    private getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = path.join(this.extensionUri.fsPath, "src/colaroid/views", "timelinePanel.html");
        let html = fs.readFileSync(htmlPath, "utf-8");

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, "src/colaroid/views", "timelinePanel.js")));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, "src/colaroid/views", "timelinePanel.css")));
        const nonce = getNonce();

        html = html.replace(/\${scriptUri}/g, scriptUri.toString());
        html = html.replace(/\${styleUri}/g, styleUri.toString());
        html = html.replace(/\${nonce}/g, nonce);

        return html;
    }

    //gets the step index for the specific student branch
    public getStepfromHash(hash: string, branch: string): number {
        if (branch === "student") {
            for (const [key, value] of this.studentStepMap) {
                if (value.some(item => item === hash)) {
                    return key;
                }
            }
            throw new Error("getStepfromHash: student hash does not exist");
        } else if (branch === "master") {
            for (const [key, value] of this.masterStepMap) {
                if (value === hash) return key;
            };
            throw new Error("getStepfromHash: master hash does not exist");
        } else {
            throw new Error("getStepfromHash: give master or student as string");
        }
    }

    private removeHash(step: number, hash: string): void {
        const array = this.studentStepMap.get(step);
        if (array) {
            const updatedArray = array.filter(item => item !== hash);
            this.studentStepMap.set(step, updatedArray);
        } else {
            throw new Error("removeHash: step does not exist")
        }
    }

    private addHash(step: number, hash: string): void {
        const array = this.studentStepMap.get(step);
        if (array) {
            array.push(hash);
        } else {
            throw new Error("addHash: step does not exist")
        }
    }

    //if one step of the mastertree is deleted
    public deleteStep(map: Map<number, any>, index: number): void {
        if (![...map.keys()].includes(index))
            throw new Error("deleteStep: step does not exist")
        for (const [key, value] of map) {
            if (key === index) {
                continue;
            } else if (key > index) {
                map.set(key - 1, value);
            } else {
                map.set(key, value);
            }
        }
        map.delete(Math.max(...map.keys()));
        //TODO: either give new map as return and assign there, or delete last index at the end.
    }

    private containsHash(hash: string, branch: string): Boolean {
        if (branch === "master") {
            for (const masterHash of this.masterStepMap.values()) {
                if (masterHash === hash) return true
            }
        } else if (branch === "student") {
            for (const studentHashes of this.studentStepMap.values()) {
                if (studentHashes.includes(hash)) return true
            }
        }
        return false;
    }

    // function is taken from notebook/features/output/HTMLOutputrenderer 
    // future work could include allow for hyperlinks to other html files within the directory 
    // this could also be achieved by creating a temporary folder with the files and hosting a localhost server 
    private processDocument(data) {
        const htmlDocuments = data.result.filter(
            (e) => e.format === "html"
        );
        let mainHTMLDocument = htmlDocuments[0]?.content;

        // match the script name
        const jsRegex = /<script src=(.*\.js?).>\s*<\/script>/g;
        const cssRegex = /<link rel=.stylesheet.* href=(.*\.css?).*>/g;
        const jsResults = [...mainHTMLDocument.matchAll(jsRegex)];
        jsResults.forEach((line) => {
            const jsLine = line[0];
            const fileName = line[1].replace(/"|\\/g, "");
            const jsDocument = data.result.filter(
                (e) => e.title === fileName
            );
            const jsDocumentContent = jsDocument[0]?.content;
            mainHTMLDocument = mainHTMLDocument.replace(
                jsLine,
                `<script>${jsDocumentContent}</script>`
            );
        });

        const cssResults = [...mainHTMLDocument.matchAll(cssRegex)];
        cssResults.forEach((line) => {
            const cssLine = line[0];
            const fileName = line[1].replace(/"|\\/g, "");
            const cssDocument = data.result.filter(
                (e) => e.title === fileName
            );
            const cssDocumentContent = cssDocument[0]?.content;
            mainHTMLDocument = mainHTMLDocument.replace(
                cssLine,
                `<style>${cssDocumentContent}</style>`
            );
        });
        return mainHTMLDocument;
    };

    private replaceChars(html) {
        return html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

}

