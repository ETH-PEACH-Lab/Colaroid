import * as React from 'react';
import MonacoEditor, { EditorConstructionOptions, MonacoDiffEditor } from 'react-monaco-editor';
import { CellProps } from "./Cell";
import { Row, Col, Container } from 'react-bootstrap';
import { getLanguage } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { selectContent } from './notebookSlice';

export function CellCodeEditorV2(props: CellProps) {
    const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
    const content = useAppSelector(selectContent);

    const switchFileIndex = (index) => {
        setCurrentFileIndex(index);
    };
    // TODO: scroll the diff editor to the first line
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
                    <MonacoEditor
                        value={props.content.result[currentFileIndex].content}
                        options={{ ...options, readOnly: true } as EditorConstructionOptions}
                        theme="vs-dark"
                        language={getLanguage(props.content.result[currentFileIndex].format)}
                    />
            </Col>
        </Row>
    </div>;
}