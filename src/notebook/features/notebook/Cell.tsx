import * as React from 'react';
import { CellData, selectActiveEdit } from "./notebookSlice";
import { CellToolbar } from './CellToolbar';
import { CellMDEditor } from './CellMDEditor';
import { Output } from '../output/Output';
import { isExtension } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { CellEditor } from './CellEditor';
import { CellCodeToolbar } from './CellCodeToolbar';
export interface CellProps {
    content: CellData,
    index: number,
    mdOnly: boolean
}
export function Cell(props: CellProps) {


    const activeEdit = useAppSelector(selectActiveEdit);
    return <div className={props.index === activeEdit ? `cell-wrapper selectedwrapper` : `cell-wrapper`} id={`cell-wrapper-${props.content.hash}`}>
        {isExtension &&
        <CellToolbar hash={props.content.hash} index={props.index} mdOnly={props.mdOnly} />
        }
        <CellMDEditor content={props.content} index={props.index} mdOnly={props.mdOnly} />
        {!props.mdOnly &&
            <>
                <CellEditor content={props.content} index={props.index} mdOnly={props.mdOnly} ></CellEditor>
                <Output content={props.content} index={props.index} mdOnly={props.mdOnly} />
            </>
        }

    </div>;
}