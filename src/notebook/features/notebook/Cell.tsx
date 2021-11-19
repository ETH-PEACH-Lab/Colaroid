import * as React from 'react';
import { CellData } from "./notebookSlice";
import { CellToolbar } from './CellToolbar';
import { CellMDEditor } from './CellMDEditor';
import { CellCodeEditor } from './CellCodeEditor';
import { Output } from '../output/Output';
import { CellCodeEditorV2 } from './CellCodeEditorV2';
import { CellCodeEditorV3 } from './CellCodeEditorV3';
import { Dropdown, DropdownButton } from 'react-bootstrap';
export interface CellProps {
    content: CellData,
    index: number
}
export function Cell(props: CellProps) {
    const [style, setStyle] = React.useState(0);

    return <div className='cell-wrapper' id={`cell-wrapper-${props.content.hash}`}>
        <CellToolbar hash={props.content.hash} />
        <CellMDEditor content={props.content} index={props.index} />
        <DropdownButton id="dropdown-item-button" title="Code Style">
            <Dropdown.Item as="button" onClick={() => { setStyle(0) }}>Diff</Dropdown.Item>
            <Dropdown.Item as="button" onClick={() => { setStyle(1) }}>Snapshot</Dropdown.Item>
            <Dropdown.Item as="button" onClick={() => { setStyle(2) }}>Summary</Dropdown.Item>
        </DropdownButton>
        {style == 0 &&
            <CellCodeEditor content={props.content} index={props.index} />
        }
        {style == 1 &&
            <CellCodeEditorV2 content={props.content} index={props.index} />
        }
        {style == 2 &&
            <CellCodeEditorV3 content={props.content} index={props.index} />
        }
        <Output content={props.content} index={props.index} />
    </div>;
}