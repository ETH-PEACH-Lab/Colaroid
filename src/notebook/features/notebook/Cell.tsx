import * as React from 'react';
import { CellData } from "./notebookSlice";
import { CellToolbar } from './CellToolbar';
import { CellMDEditor } from './CellMDEditor';
import { CellCodeEditor } from './CellCodeEditor';
import { Output } from '../output/Output';
import { CellCodeEditorV2 } from './CellCodeEditorV2';
import { CellCodeEditorV3 } from './CellCodeEditorV3';
export interface CellProps {
    content: CellData,
    index: number,
    cstyle: number
}
export function Cell(props: CellProps) {

    return <div className='cell-wrapper' id={`cell-wrapper-${props.content.hash}`}>
        <CellToolbar hash={props.content.hash} />
        <CellMDEditor content={props.content} index={props.index} cstyle={props.cstyle}/>
        {props.cstyle === 0 &&
            <CellCodeEditor content={props.content} index={props.index} cstyle={props.cstyle}/>
        }
        {props.cstyle === 1 &&
            <CellCodeEditorV2 content={props.content} index={props.index} cstyle={props.cstyle}/>
        }
        {props.cstyle === 2 &&
            <CellCodeEditorV3 content={props.content} index={props.index} cstyle={props.cstyle}/>
        }
        <Output content={props.content} index={props.index} cstyle={props.cstyle}/>
    </div>;
}