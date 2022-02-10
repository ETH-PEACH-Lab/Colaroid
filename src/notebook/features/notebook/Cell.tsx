import * as React from 'react';
import { CellData, selectActiveEdit } from "./notebookSlice";
import { CellToolbar } from './CellToolbar';
import { CellMDEditor } from './CellMDEditor';
import { Output } from '../output/Output';
import { isExtension } from '../../utils';
import { useAppSelector } from '../../app/hooks';
import { CellEditor } from './CellEditor';
export interface CellProps {
    content: CellData,
    index: number,
    mdOnly: boolean
}
export function Cell(props: CellProps) {
    const [style, setStyle] = React.useState(2);
    const switchStyle = () => {
        const newStyle = (style + 1) % 3;
        setStyle(newStyle);
        return newStyle;
    }

    const activeEdit = useAppSelector(selectActiveEdit);
    return <div className={props.index === activeEdit ? `cell-wrapper selectedwrapper` : `cell-wrapper`} id={`cell-wrapper-${props.content.hash}`}>
        <CellMDEditor content={props.content} index={props.index} mdOnly={props.mdOnly} />

        {isExtension &&
            <CellToolbar hash={props.content.hash} index={props.index} mdOnly={props.mdOnly} switchStyle={switchStyle} />
        }
        {!props.mdOnly &&
            <>
                <CellEditor content={props.content} index={props.index} mdOnly={props.mdOnly} style={style}></CellEditor>
                <Output content={props.content} index={props.index} mdOnly={props.mdOnly} />
            </>
        }

    </div>;
}