import * as React from 'react';
import { vscode } from '../../utils';
export function InputBox() {
    const inputRef = React.createRef<HTMLTextAreaElement>();

    const createSnapshot = () => {
        const content = inputRef.current?.value;
		vscode.postMessage({
			content,
			command: "add",
		}); 
    };
    return <div>
        <textarea placeholder="instructions here..." id="snapshot-input" ref={inputRef}></textarea>
        <button id="snapshot-btn" onClick={createSnapshot}><i className="fa fa-plus"></i>
            Insert a Snapshot
        </button>
        <div id="toolbar-wrapper"></div>
    </div>;
}