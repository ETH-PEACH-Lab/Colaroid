import * as React from 'react';
import MonacoEditor, { EditorConstructionOptions, MonacoDiffEditor } from 'react-monaco-editor';
import { CellProps } from "./Cell";
import { Row, Col, Badge } from 'react-bootstrap';
import { getLanguage } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { selectContent } from './notebookSlice';
import * as Diff from 'diff';

export function CellCodeEditor(props: CellProps) {
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

    const editorDidMount = (editor) => {
        editor.onDidUpdateDiff(() => {
            const changes = editor.getLineChanges();
            if (changes.length > 0) {
                const startNumber = changes[0].originalStartLineNumber;
                editor.revealLineNearTop(startNumber);
            }
        });
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
                            {item.title}    <Badge pill bg="warning" text="dark">
                                {computeChanges(index)}</Badge>
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