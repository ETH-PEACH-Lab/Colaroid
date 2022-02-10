import * as React from 'react';
import MonacoEditor, { EditorConstructionOptions, monaco, MonacoDiffEditor } from 'react-monaco-editor';
export interface CellCodeDiffProps {
    language: string,
    current: string,
    original: string,
    style: number
}
export function CellCodeDiff(props: CellCodeDiffProps) {
    let editor = null;
    let changes = [];
    const options = {
        cursorBlinking: 'smooth',
        folding: true,
        lineNumbersMinChars: 4,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        // Render the diff inline
        renderSideBySide: false,
        renderIndicators: false,
        renderOverviewRuler: false,
    };

    const editorDidMount = (editor) => {
        editor.onDidUpdateDiff(() => {
            const changes = editor.getLineChanges();
            if (changes.length > 0) {
                const startNumber = changes[0].originalStartLineNumber;
                editor.revealLineNearTop(startNumber);
            }
        });
    };

    const editorDidMount2 = (myeditor, monaco) => {
        editor = myeditor;
        renderDiff(myeditor, changes);
    };
    const diffEditorDidMount = (myeditor, monaco) => {
        myeditor.onDidUpdateDiff(() => {
            const mychanges = myeditor.getLineChanges();
            changes = mychanges;
            renderDiff(editor, mychanges);
        });
    };
    const renderDiff = (myeditor, mychanges) => {
        // todo: add a red mark when lines are deleted
        if (myeditor && (mychanges.length > 0)) {
            mychanges.forEach(mychange => {
                if (mychange.modifiedStartLineNumber < mychange.modifiedEndLineNumber) {
                    myeditor.deltaDecorations(
                        [],
                        [
                            {
                                range: new monaco.Range(mychange.modifiedStartLineNumber, 1, mychange.modifiedEndLineNumber, 1),
                                options: {
                                    isWholeLine: true,
                                    linesDecorationsClassName: 'myLineDecoration',
                                    inlineClassName: 'myInlineDecoration'
                                }
                            }
                        ]
                    )
                }
            })
            myeditor.revealLineNearTop(mychanges[0].modifiedStartLineNumber);
        }
    };
    const editorDidMount3 = (editor, monaco) => {
        editor.onDidUpdateDiff(() => {
            const changes = editor.getLineChanges();
            let oPrevLine = 1;
            let mPrevLine = 1;
            let originalHiddenArea = [] as any;
            let modifiedHiddenArea = [] as any;
            changes.forEach(change => {
                let oChangeStart;
                let mChangeStart;
                // if add lines
                if (change.originalEndLineNumber === 0) {
                    oChangeStart = change.originalStartLineNumber - 1;
                    mChangeStart = change.modifiedStartLineNumber - 2;
                    if (oChangeStart > oPrevLine) originalHiddenArea.push(new monaco.Range(oPrevLine, 1, oChangeStart, 1));
                    if (mChangeStart > mPrevLine) modifiedHiddenArea.push(new monaco.Range(mPrevLine, 1, mChangeStart, 1));
                    oPrevLine = change.originalStartLineNumber + 2;
                    mPrevLine = change.modifiedEndLineNumber + 2;
                }

                // if delete lines
                if (change.modifiedEndLineNumber === 0) {
                    oChangeStart = change.originalStartLineNumber - 2;
                    mChangeStart = change.modifiedStartLineNumber - 1;
                    if (oChangeStart > oPrevLine) originalHiddenArea.push(new monaco.Range(oPrevLine, 1, oChangeStart, 1));
                    if (mChangeStart > mPrevLine) modifiedHiddenArea.push(new monaco.Range(mPrevLine, 1, mChangeStart, 1));
                    oPrevLine = change.originalEndLineNumber + 2;
                    mPrevLine = change.modifiedStartLineNumber + 2;
                }

                // if modify lines
                if (change.originalEndLineNumber !== 0 && change.modifiedEndLineNumber !== 0) {
                    oChangeStart = change.originalStartLineNumber - 1;
                    mChangeStart = change.modifiedStartLineNumber - 1;
                    if (oChangeStart > oPrevLine) originalHiddenArea.push(new monaco.Range(oPrevLine, 1, oChangeStart, 1));
                    if (mChangeStart > mPrevLine) modifiedHiddenArea.push(new monaco.Range(mPrevLine, 1, mChangeStart, 1));
                    oPrevLine = change.originalEndLineNumber + 2;
                    mPrevLine = change.modifiedEndLineNumber + 2;
                }
            });
            const oLineCount = editor.getOriginalEditor().getModel().getLineCount();
            const mLineCount = editor.getModifiedEditor().getModel().getLineCount();
            if(oPrevLine < oLineCount)
            originalHiddenArea.push(new monaco.Range(oPrevLine, 1, oLineCount, 1));
            if(mPrevLine < mLineCount)
            modifiedHiddenArea.push(new monaco.Range(mPrevLine, 1, mLineCount, 1));
            editor.getOriginalEditor().setHiddenAreas(originalHiddenArea);
            editor.getModifiedEditor().setHiddenAreas(modifiedHiddenArea);
        });
    };
    return <div>
        {props.style === 0 &&
            <div style={{ height: '250px' }}>
                <MonacoDiffEditor
                    language={props.language}
                    options={{ ...options, readOnly: true } as EditorConstructionOptions}
                    theme="vs-dark"
                    original={props.original}
                    value={props.current}
                    editorDidMount={editorDidMount}
                />
            </div>
        }
        {props.style === 1 &&
            <div style={{ height: '250px' }}>
                <MonacoEditor
                    value={props.current}
                    options={{ ...options, readOnly: true } as EditorConstructionOptions}
                    theme="vs-dark"
                    language={props.language}
                    editorDidMount={editorDidMount2}
                />
                <div style={{ display: "none" }}>                    <MonacoDiffEditor
                    language={props.language}
                    options={{ ...options, readOnly: true } as EditorConstructionOptions}
                    theme="vs-dark"
                    original={props.original}
                    value={props.current}
                    editorDidMount={diffEditorDidMount}
                /></div>
            </div>
        }
        {props.style === 2 &&
            <div style={{ height: '250px' }}>
                <MonacoDiffEditor
                    language={props.language}
                    options={{ ...options, readOnly: true } as EditorConstructionOptions}
                    theme="vs-dark"
                    original={props.original}
                    value={props.current}
                    editorDidMount={editorDidMount3}
                />
            </div>
        }
    </div>;

}
