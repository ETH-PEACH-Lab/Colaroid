import * as React from 'react';
import { isExtension, vscode } from '../../utils';
import { store } from '../../app/store';
export function InputBox() {
    const [isHide, setHide] = React.useState(false);
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

    const switchHide = () => {
        setHide(!isHide);
    };

    return <div className="input-box-wrapper pane expanded vertical">
        <div className="pane-header">
            <i className={isHide ? "codicon codicon-chevron-up" : "codicon codicon-chevron-down"} onClick={switchHide}>
            </i>
            <div className="pane-title">CURRENT STEP</div>
        </div>
        {!isHide &&
            <div className="pane-content">
                <textarea placeholder="Instructions here..." id="snapshot-input" ref={inputRef}></textarea>
                <div className="button-container">
                <button className="instruction-btn" id="snapshot-btn" onClick={createSnapshot}>
                    <i className="codicon codicon-pencil" style={{marginRight:'5px'}}></i>  Insert a Snapshot
                </button>
                {/* {isExtension &&
                        <button className="instruction-btn" id="export-btn" onClick={exportNotebook}>
                            <i className="codicon codicon-go-to-file" style={{marginRight: '5px'}}></i>  Export Notebook
                        </button>
                } */}
            </div>
            </div>
        }
    </div>;
}