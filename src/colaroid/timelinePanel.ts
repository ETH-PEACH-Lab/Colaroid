//https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/src/extension.ts

/*

Notes: 
- elementId for step-container make it required unique??
- change names of save and commit button to student and master button
- for the student and commit buttons use id instead of title for id
- think about making two classes for the lines, one for within step lines and one for inbetween steps lines
- state logic might be faulty if notebookpanel and timelinepanel are closed seperatly -> maybe if one closes close the other one aswell
- Reset function (reset the studentbranch)
*/

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getNonce, saveLocalDocStudent, readLocalDoc } from './utils';
import { GitService } from './gitService';
import { ColaroidNotebookPanel } from './notebook'
import { error } from 'console';

export class TimelinePanel implements vscode.WebviewViewProvider {
    private panel?: vscode.WebviewView;
    //private readonly extensionUri: vscode.Uri;
    public gitService: GitService;
    public colaroidNotebookPanel: ColaroidNotebookPanel;

    //TODO: instead of having just a index (starts from 0) give each step a name 
    private studentStepMap = new Map<number, string[]>();
    private masterStepMap = new Map<number, string>();

    public static readonly viewType = 'colaroid.timelinePanel';

    // Static method to create or show the panel (TODO: should this method be static?)
    public resolveWebviewView(webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,) {

        this.panel = webviewView;

        webviewView.webview.options =
        {
            enableScripts: true,
            //localResourceRoots: [this.extensionUri]
            localResourceRoots: [
                vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src/colaroid/views')),
                vscode.Uri.file(path.join(this.extensionUri.fsPath, 'media')),
                vscode.Uri.file(path.join(this.extensionUri.fsPath, 'node_modules/showdown'))
            ],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            //console.log("THIS IS SEND ", message.id , " ", message.command)
            switch (message.command) {
                case 'revert snapshot':
                    await this.colaroidNotebookPanel.handleMessage(message)
                    this.updateActiveState(this.colaroidNotebookPanel.getIndex())
                    this.updateActiveHash(message.id);
                    break;
                case 'save':
                    this.saveStep();
                    break;
                case 'nextStep':
                    await this.colaroidNotebookPanel.handleMessage(message)
                    this.updateActiveState(this.colaroidNotebookPanel.getIndex())
                    break;
                case 'prevStep':
                    await this.colaroidNotebookPanel.handleMessage(message)
                    this.updateActiveState(this.colaroidNotebookPanel.getIndex())
                    break;
                case 'remove student button':
                    const step = this.getStepfromHash(message.id, "student");
                    this.removeHash(step, message.id);
                    await this.colaroidNotebookPanel.handleMessage(message)
                    break
                case 'display step':
                    this.displayStep();
                    break
            }
        });

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

            this.panel.webview.postMessage({
                command: "updateTimelineMaster",
                hash: data.hash,
                step: step
            });
        } else if (this.panel && branch === "student") {
            //is only called at the beginning when notebook is opened, for adding while open refer to saveStep
            this.panel.webview.postMessage({
                command: "updateTimelineStudent",
                hash: data.hash,
                step: data.step
            });
            this.addHash(data.step, data.hash);
        } else {
            console.warn("TimelinePanel is not active, cannot update timeline.");
        }
    }

    //this is only for master branch
    public removeButton(data: any) {
        if (this.panel) {
            const index = this.getStepfromHash(data.id, "master")
            this.deleteStep(this.masterStepMap, index)
            this.deleteStep(this.studentStepMap, index)
            const studentArray = []
            for (const [step, hashes] of this.studentStepMap) {
                for (const hash of hashes) {
                    studentArray.push({ hash: hash, step: step });
                }
            }
            saveLocalDocStudent(this.colaroidNotebookPanel.getPath(), studentArray);
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
                command: 'save',
                hash: result.commit
            };
            // adds student button
            await this.colaroidNotebookPanel.handleMessage(data)
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: "addStudent",
                    hash: data.hash,
                    step: index
                });
            }
            this.addHash(index, data.hash)
        });
    }

    public updateActiveState(state: number) {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: "update active state",
                state: state,
                content: this.colaroidNotebookPanel.getContent(state).message
            });
        }
    }

    public updateActiveHash(hash: string) {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: "update active hash",
                hash: hash
            });
        }
    }

    public async clearView() {
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

    private displayStep() {
        this.colaroidNotebookPanel.display(this.extensionUri);
    }

    public constructor(private readonly extensionUri: vscode.Uri, private path: string) { }

    // Generate the HTML content for the webview
    private getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = path.join(this.extensionUri.fsPath, 'src/colaroid/views', 'timelinePanel.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src/colaroid/views', 'timelinePanel.js')));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.fsPath, 'src/colaroid/views', 'timelinePanel.css')));
        const nonce = getNonce();

        html = html.replace(/\${scriptUri}/g, scriptUri.toString());
        html = html.replace(/\${styleUri}/g, styleUri.toString());
        html = html.replace(/\${nonce}/g, nonce);

        return html;
    }

    //gets the step index for the specific student branch
    private getStepfromHash(hash: string, branch: string): number {
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

}
