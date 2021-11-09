import * as React from 'react';
import { CellProps } from './Cell';
import MonacoEditor, { EditorConstructionOptions, monaco } from "react-monaco-editor";
import MarkdownView from 'react-showdown';
import { useAppDispatch } from '../../app/hooks';
import { changeMarkdown } from './notebookSlice';
import { vscode } from '../../utils';

export function CellMDEditor(props: CellProps) {
    const [mode, setMode] = React.useState(false);
    const [height, setHeight] = React.useState('10px');
    const [keyPressed, setKeyPressed] = React.useState({});
    const [markdownValue, setMarkdownValue] = React.useState(props.content.message);
    const markdownEditorRef = React.createRef<HTMLDivElement>();
    const markdownPreviewRef = React.createRef<HTMLDivElement>();

    const dispatch = useAppDispatch();


    const options = {
        cursorBlinking: 'smooth',
        folding: true,
        lineNumbersMinChars: 4,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true
    };

    const switchMode = () => {
        setMode(!mode);
    };

    const keydownHandler = (e) => {
        keyPressed[e.key] = true;
        setKeyPressed(keyPressed);
        if (e.key === "Enter" && keyPressed["Shift"]) {
            switchMode();
            dispatch(changeMarkdown({hash: props.content.hash, message: markdownValue}));
            markdownValue.replace("\n", "\r\n");
            markdownValue.replace("\n", "\r");
            vscode.postMessage({
                content: markdownValue,
                command: "revise message",
                id: props.content.hash
            });
        }
    };

    const keyupHandler = (e) => {
        keyPressed[e.key] = false;
        setKeyPressed(keyPressed);
    };

    const onChangeHandler = (value, e) => {
        setMarkdownValue(value);
    };

    const editorDidMount = (editor, monaco) => {
        setHeight(((editor.getModel().getLineCount() + 2) * 19).toString() + 'px');
    };

    return <div>
        <div className='md-cell-wrapper' id={`md-cell-wrapper-${props.content.hash}`}>
            {mode ?
                <div ref={markdownEditorRef} className='md-cell-editor' id={`md-cell-editor-${props.content.hash}`} style={{ height: height }} onKeyDown={keydownHandler} onKeyUp={keyupHandler}>
                    <MonacoEditor
                        language="markdown"
                        options={{ ...options, readOnly: false } as EditorConstructionOptions}
                        value={markdownValue}
                        theme="vs-dark"
                        onChange={onChangeHandler}
                        editorDidMount={editorDidMount}
                    />
                </div>
                :
                <div ref={markdownPreviewRef} className='md-cell-preview' id={`md-cell-preview-${props.content.hash}`} onDoubleClick={switchMode}>
                    <MarkdownView markdown={props.content.message} options={{ tables: true, emoji: true }} />
                </div>
            }
        </div>
    </div>;
}