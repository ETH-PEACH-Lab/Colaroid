import * as React from 'react';
import { isExtension, vscode } from '../../utils';
import { store } from '../../app/store';
export function InputBox() {
    const inputRef = React.createRef<HTMLTextAreaElement>();

    const createSnapshot = () => {
        const content = inputRef.current?.value;
		vscode.postMessage({
			content,
			command: "add",
		});
        inputRef.current!.value = ''; 
    };

    const exportNotebook = () => {
        const state = store.getState();
        vscode.postMessage({
            content: state,
            command: "export state"
        });
    };
    return <div>
        <textarea placeholder="instructions here..." id="snapshot-input" ref={inputRef}></textarea>
        <button className="instruction-btn" id="snapshot-btn" onClick={createSnapshot}>
            <i className="codicon codicon-pencil"></i>  Insert a Snapshot
        </button>
        {isExtension &&
                <button className="instruction-btn" id="export-btn" onClick={exportNotebook}>
                <i className="codicon codicon-go-to-file"></i>  Export Notebook
            </button>
        }
        <div id="toolbar-wrapper"></div>
    </div>;
}