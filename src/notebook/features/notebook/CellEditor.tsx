import * as React from 'react';
import MonacoEditor, { EditorConstructionOptions, MonacoDiffEditor } from 'react-monaco-editor';
import { Row, Col, Badge } from 'react-bootstrap';
import { getLanguage, isExtension } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { CellData, selectActiveEdit, selectContent } from './notebookSlice';
import * as Diff from 'diff';
import { CellCodeDiff } from './CellCodeDiff';
import { CellCodeToolbar } from './CellCodeToolbar';
export interface CellEditorProps {
    content: CellData,
    index: number,
    mdOnly: boolean,
}
export function CellEditor(props: CellEditorProps) {
    const [style, setStyle] = React.useState(0);
    const switchStyle = (i?) => {
        const newStyle = i?i:(style + 1) % 3;
        setStyle(newStyle);
        return newStyle;
    };
    const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
    const activeEdit = useAppSelector(selectActiveEdit);

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

    const computeChanges = (fileIndex) => {
        const newFile = props.content.result[fileIndex];
        let oldIndex = props.index - 1;
        while (oldIndex >= 0 && content[oldIndex].hash === '') {
            oldIndex = oldIndex - 1;
        }
        if (oldIndex < 0) return '';
        const oldResult = content[oldIndex].result;
        const oldFiles = oldResult.filter((e) => e.title === newFile.title);
        if (oldFiles.length === 0) return 'new';
        const oldFile = oldFiles[0];
        const diff = Diff.diffLines(newFile.content, oldFile.content);
        const validDiff = diff.filter(e => e.added | e.removed);
        if (validDiff.length === 0) return '';
        return validDiff.length.toString();
    }

    const findIndex = () => {
        let target;
        content.forEach((e, index) => {
            if (e.hash === props.content.hash) {
                target = index;
            }
        });
        return target;
    };

    return <div>
        {isExtension &&
            <CellCodeToolbar hash={props.content.hash} index={props.index} mdOnly={props.mdOnly} switchStyle={switchStyle} />
        }
        <div>
        <Row className="code-cell-wrapper" id={`code-cell-wrapper-${props.content.hash}`}>
            <Col xs={2} className="title-list-wrapper">
                <div className="title-list-title">FILE LIST</div>
                <ul>
                    {props.content.result.map((item, index) =>
                        <li key={index} onClick={() => { switchFileIndex(index) }} className={index === currentFileIndex ? "selected" : ""}>
                            {item.title}    <Badge pill bg="warning" text="dark">
                                {computeChanges(index)}</Badge>
                        </li>
                    )}
                </ul>
            </Col>

            <Col xs={10} className="code-cell" id={`code-cell-${props.content.hash}`} >
                {activeEdit === findIndex() ?
                    <div className="edit-in-progress">Please edit the current step in the code editor.</div>
                    :
                    <div>
                        {props.index === 0 ?
                            <div style={{ height: '250px' }}>
                                <MonacoEditor
                                    value={props.content.result[currentFileIndex].content}
                                    options={{ ...options, readOnly: true } as EditorConstructionOptions}
                                    theme="vs-dark"
                                    language={getLanguage(props.content.result[currentFileIndex].format)}
                                />
                            </div>
                            :
                            <CellCodeDiff language={getLanguage(props.content.result[currentFileIndex].format)} style={style} original={getOriginalContent()} current={props.content.result[currentFileIndex].content}></CellCodeDiff>
                        }
                    </div>
                }
            </Col>
        </Row>
        </div>
    </div>;



}