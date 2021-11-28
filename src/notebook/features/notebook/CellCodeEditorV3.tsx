import * as React from 'react';
import MonacoEditor, { EditorConstructionOptions, monaco, MonacoDiffEditor } from 'react-monaco-editor';
import { CellProps } from "./Cell";
import { Row, Col, Container } from 'react-bootstrap';
import { getLanguage } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { selectContent } from './notebookSlice';

export function CellCodeEditorV3(props: CellProps) {
    const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
    const content = useAppSelector(selectContent);

    const switchFileIndex = (index) => {
        setCurrentFileIndex(index);
    };
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

    const getOriginalContent = () => {
        const files = content[props.index - 1].result;
        let match = '';
        files.forEach(file => {
            if (file.title === props.content.result[currentFileIndex].title) {
                match = file.content;
            }
        });
        return match;
    };

    const editorDidMount = (editor, monaco) => {
        editor.onDidUpdateDiff(() => {
            const changes = editor.getLineChanges();
            let oPrevLine = 2;
            let mPrevLine = 2;
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
                if (change.originalEndLineNumber != 0 && change.modifiedEndLineNumber != 0) {
                    oChangeStart = change.originalStartLineNumber - 1;
                    mChangeStart = change.modifiedStartLineNumber - 1;
                    if (oChangeStart > oPrevLine) originalHiddenArea.push(new monaco.Range(oPrevLine, 1, oChangeStart, 1));
                    if (mChangeStart > mPrevLine) modifiedHiddenArea.push(new monaco.Range(mPrevLine, 1, mChangeStart, 1));
                    oPrevLine = change.originalEndLineNumber + 2;
                    mPrevLine = change.modifiedEndLineNumber + 2;
                }
            });
            editor.getOriginalEditor().setHiddenAreas(originalHiddenArea);
            editor.getModifiedEditor().setHiddenAreas(modifiedHiddenArea);
        });
    };

    return <div>
        <Row className="code-cell-wrapper" id={`code-cell-wrapper-${props.content.hash}`}>
            <Col xs={2} className="title-list-wrapper">
                <div className="title-list-title">FILE LIST</div>
                <ul>
                    {props.content.result.map((item, index) =>
                        <li key={index} onClick={() => { switchFileIndex(index) }}>
                            {item.title}
                        </li>
                    )}
                </ul>
            </Col>

            <Col xs={10} className="code-cell" id={`code-cell-${props.content.hash}`} style={{ height: '250px' }}>
                {props.index === 0 ?
                    <MonacoEditor
                        value={props.content.result[currentFileIndex].content}
                        options={{ ...options, readOnly: true } as EditorConstructionOptions}
                        theme="vs-dark"
                        language={getLanguage(props.content.result[currentFileIndex].format)}
                    />
                    :
                    <MonacoDiffEditor
                        language={getLanguage(props.content.result[currentFileIndex].format)}
                        options={{ ...options, readOnly: true } as EditorConstructionOptions}
                        theme="vs-dark"
                        original={getOriginalContent()}
                        value={props.content.result[currentFileIndex].content}
                        editorDidMount={editorDidMount}
                    />
                }
            </Col>
        </Row>
    </div>;
}