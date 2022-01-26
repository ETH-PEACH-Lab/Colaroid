import * as React from 'react';
import { CellData, selectActiveEdit } from "./notebookSlice";
import { CellToolbar } from './CellToolbar';
import { CellMDEditor } from './CellMDEditor';
import { CellCodeEditor } from './CellCodeEditor';
import { Output } from '../output/Output';
import { CellCodeEditorV2 } from './CellCodeEditorV2';
import { CellCodeEditorV3 } from './CellCodeEditorV3';
import { isExtension } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { propTypes } from 'react-bootstrap/esm/Image';
export interface CellProps {
    content: CellData,
    index: number,
    cstyle: number,
    mdOnly: boolean
}
export function Cell(props: CellProps) {
    const activeEdit = useAppSelector(selectActiveEdit);
    return <div className={props.index===activeEdit?`cell-wrapper selectedwrapper`:`cell-wrapper`} id={`cell-wrapper-${props.content.hash}`}>
        {isExtension &&
                <CellToolbar hash={props.content.hash} index={props.index} mdOnly={props.mdOnly}/>
        }
        <CellMDEditor content={props.content} index={props.index} cstyle={props.cstyle} mdOnly={props.mdOnly}/>
        {!props.mdOnly && 
        <>
        {props.cstyle === 0 &&
            <CellCodeEditor content={props.content} index={props.index} cstyle={props.cstyle} mdOnly={props.mdOnly}/>
        }
        {props.cstyle === 1 &&
            <CellCodeEditorV2 content={props.content} index={props.index} cstyle={props.cstyle} mdOnly={props.mdOnly}/>
        }
        {props.cstyle === 2 &&
            <CellCodeEditorV3 content={props.content} index={props.index} cstyle={props.cstyle} mdOnly={props.mdOnly}/>
        }
        <Output content={props.content} index={props.index} cstyle={props.cstyle} mdOnly={props.mdOnly}/>
        </>
        }
        
    </div>;
}