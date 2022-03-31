import * as React from 'react';
import { vscode } from '../../utils';
import { store } from '../../app/store';
import { useAppSelector } from '../../app/hooks';
import { selectViewOption } from '../notebook/notebookSlice';
export function InputBox() {
    const [isHide, setHide] = React.useState(false);
    const inputRef = React.createRef<HTMLTextAreaElement>();
    const viewOption = useAppSelector(selectViewOption);


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
        {viewOption === '2' &&
        <div>
        <div className="pane-header">
            <i className={isHide ? "codicon codicon-chevron-up" : "codicon codicon-chevron-down"} onClick={switchHide}>
            </i>
            <div className="pane-title">NEW STEP</div>
        </div>
        {!isHide &&
            <div className="pane-content">
                <textarea placeholder="Instructions here..." id="snapshot-input" ref={inputRef}></textarea>
                <div className="button-container">
                <button className="instruction-btn" id="snapshot-btn" onClick={createSnapshot}>
                    <i className="codicon codicon-pencil" style={{marginRight:'5px'}}></i>  Insert a Step
                </button>
            </div>
            </div>
        }
        </div>
        }

    </div>;
}