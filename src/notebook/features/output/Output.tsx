import * as React from 'react';
import { CellProps } from '../notebook/Cell';
import { HTMLOutputRender } from './HTMLOutputRender';

export const Output = (props: CellProps) =>{
    const isHTML = props.content.result[0].format === 'html';
    return <div>
        {isHTML &&
        <HTMLOutputRender content={props.content} index={props.index} cstyle={props.cstyle} mdOnly={props.mdOnly}/>    
        }
    </div>;
};