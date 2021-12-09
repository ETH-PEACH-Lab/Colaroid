import * as React from 'react';
import { HTMLOutputRender } from './HTMLOutputRender';

export const Output = (props: any) =>{
    const isHTML = props?.content?.result[0].format === 'html';
    return <div>
        {isHTML &&
        <HTMLOutputRender content={props.content} index={props.index} />    
        }
    </div>;
};