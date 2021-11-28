import * as React from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectContent } from './notebookSlice';
import { Cell } from './Cell';
import { Dropdown, DropdownButton } from 'react-bootstrap';
export function Notebook() {
    const content = useAppSelector(selectContent);
    const [style, setStyle] = React.useState(0);
    return <div>
        <DropdownButton id="dropdown-item-button" title="Switch Diff Style">
            <Dropdown.Item as="button" onClick={() => { setStyle(0)}}>Original Diff</Dropdown.Item>
            <Dropdown.Item as="button" onClick={() => { setStyle(1)}}>Highlight Modified</Dropdown.Item>
            <Dropdown.Item as="button" onClick={() => { setStyle(2)}}>Diff Only</Dropdown.Item>
        </DropdownButton>
        {content.map((cell, index) => 
        <Cell content={cell} index={index} key={index} cstyle={style}/>
        )}
    </div>;
}