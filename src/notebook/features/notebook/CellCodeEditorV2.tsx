import * as React from 'react';
import MonacoEditor, { EditorConstructionOptions, monaco, MonacoDiffEditor } from 'react-monaco-editor';
import { CellProps } from "./Cell";
import { Row, Col, Badge } from 'react-bootstrap';
import { getLanguage } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { selectActiveEdit, selectContent } from './notebookSlice';
import * as Diff from 'diff';

export function CellCodeEditorV2(props: CellProps) {
    const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
    const activeEdit = useAppSelector(selectActiveEdit);
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
        let oldIndex = props.index - 1
        while (oldIndex >= 0 && content[oldIndex].hash === '') oldIndex = oldIndex - 1;
        const files = content[oldIndex].result;
        let match = '';
        files.forEach(file => {
            if (file.title === props.content.result[currentFileIndex].title) {
                match = file.content;
            }
        });
        return match;
    };
    const findIndex = () => {
        let target;
        content.forEach((e, index) => {
            if (e.hash === props.content.hash) {
                target = index;
            }
        });
        return target;
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
    const computeChanges = (fileIndex) => {
        const newFile = props.content.result[fileIndex];
        let oldIndex = props.index - 1;
        while (oldIndex >= 0 && content[oldIndex].hash === '') {
            oldIndex = oldIndex - 1;
        }
        if (oldIndex <= 0) return '';
        const oldResult = content[oldIndex].result;
        const oldFiles = oldResult.filter((e) => e.title === newFile.title);
        if (oldFiles.length === 0) return 'new';
        const oldFile = oldFiles[0];
        const diff = Diff.diffLines(newFile.content, oldFile.content);
        const validDiff = diff.filter(e => e.added | e.removed)
        if (validDiff.length === 0) return '';
        return validDiff.length.toString();
    }
    return <div>
        <Row className="code-cell-wrapper" id={`code-cell-wrapper-${props.content.hash}`}>
            <Col xs={2} className="title-list-wrapper">
                <div className="title-list-title">FILE LIST</div>
                <ul>
                    {props.content.result.map((item, index) =>
                        <li key={index} onClick={() => { switchFileIndex(index) }}>
                            {item.title}<Badge pill bg="warning" text="dark">
                                {computeChanges(index)}</Badge>
                        </li>
                    )}
                </ul>
            </Col>

            <Col xs={10} className="code-cell" id={`code-cell-${props.content.hash}`} style={{ height: '250px' }}>
                {
                    activeEdit === findIndex() ?
                        <div className="edit-in-progress">Please edit the current step in the code editor.</div>
                        :
                        <>
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
                        </>
                }


            </Col>
        </Row>
    </div>;
}