import * as React from 'react';
import { MonacoDiffEditor } from 'react-monaco-editor';
import { CellProps } from "./Cell";
import { Row, Col, Container } from 'react-bootstrap';

export function CellCodeEditor(props: CellProps) {
    console.log(props.content.result)
    return <div>
        <Container>
        <Row className="code-cell-wrapper" id={`code-cell-wrapper-${props.content.hash}`}>
            <Col className="title-list-wrapper">
                <div className="title-list-title">FILE LIST</div>
                <ul>
                    {props.content.result.map((item, index) =>
                        <li key={index}>
                            {item.title}
                        </li>
                    )}
                </ul>

            </Col>

            <Col className="code-cell" id={`code-cell-${props.content.hash}`}>
                <h1>Code Editor</h1>

            </Col>
        </Row>
        </Container>
        
    </div>
}