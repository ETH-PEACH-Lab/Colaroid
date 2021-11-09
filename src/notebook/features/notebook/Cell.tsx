import * as React from 'react';
import { CellData } from "./notebookSlice";
import { CellToolbar } from './CellToolbar';
import { CellMDEditor } from './CellMDEditor';
import { CellCodeEditor } from './CellCodeEditor';
export interface CellProps {
    content: CellData
}
export function Cell(props: CellProps) {

    return <div className='cell-wrapper' id={`cell-wrapper-${props.content.hash}`}>
        <CellToolbar hash={props.content.hash} />
        <CellMDEditor content={props.content}/>
        <CellCodeEditor content={props.content}/>
    </div>;
}