import * as React from 'react';
import { CellProps } from '../notebook/Cell';
import { HTMLOutputRender } from './HTMLOutputRender';

export const Output = (props: CellProps) =>{
    const htmlDocuments = props.content.result.filter((e) => e.format === 'html');
    const isHTML = htmlDocuments.length > 0;
    return <div>
        {isHTML &&
        <HTMLOutputRender content={props.content} index={props.index} mdOnly={props.mdOnly}/>    
        }
    </div>;
};