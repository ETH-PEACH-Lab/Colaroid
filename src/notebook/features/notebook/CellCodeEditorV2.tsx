import * as React from 'react';
import MonacoEditor, { EditorConstructionOptions, monaco, MonacoDiffEditor } from 'react-monaco-editor';
import { CellProps } from "./Cell";
import { Row, Col, Container } from 'react-bootstrap';
import { getLanguage } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { selectContent } from './notebookSlice';

export function CellCodeEditorV2(props: CellProps) {
    const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
    let editor = null;
    let changes = [];
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

    const diffEditorDidMount = (myeditor, monaco) => {
        myeditor.onDidUpdateDiff(() => {
            const mychanges = myeditor.getLineChanges();
            changes = mychanges;
            renderDiff(editor, mychanges);
        });
    };

    const editorDidMount = (myeditor, monaco) => {
        editor = myeditor;
        renderDiff(myeditor, changes);
    };

    const renderDiff = (myeditor, mychanges) => {
        // todo: add a red mark when lines are deleted
        if (myeditor && (mychanges.length > 0)) {
            mychanges.forEach(mychange => {
                if(mychange.modifiedStartLineNumber < mychange.modifiedEndLineNumber) {
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
                    <div style={{ height: '250px' }}>
                        <MonacoEditor
                            value={props.content.result[currentFileIndex].content}
                            options={{ ...options, readOnly: true } as EditorConstructionOptions}
                            theme="vs-dark"
                            language={getLanguage(props.content.result[currentFileIndex].format)}
                            editorDidMount={editorDidMount}
                        />
                        <div style={{ display: "none" }}>                    <MonacoDiffEditor
                            language={getLanguage(props.content.result[currentFileIndex].format)}
                            options={{ ...options, readOnly: true } as EditorConstructionOptions}
                            theme="vs-dark"
                            original={getOriginalContent()}
                            value={props.content.result[currentFileIndex].content}
                            editorDidMount={diffEditorDidMount}
                        /></div>
                    </div>
                }

            </Col>
        </Row>
    </div>;
}