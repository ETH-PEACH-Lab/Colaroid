import * as React from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectContent } from './notebookSlice';
import { Cell } from './Cell';
export function Notebook() {
    const content = useAppSelector(selectContent);
    return <div>
        {content.map((cell, index) => 
        <Cell content={cell} index={index} key={index}/>
        )}
    </div>;
}