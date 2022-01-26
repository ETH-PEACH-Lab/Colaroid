import * as React from 'react';
import { useAppSelector } from '../../app/hooks';
import { store } from '../../app/store';
import { selectContent } from './notebookSlice';
import { Cell } from './Cell';
import { Button, ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap';
import { vscode } from '../../utils';
import { isExtension } from '../../utils';
import { Slide } from '../slide/Slide';
export function Notebook() {
    const content = useAppSelector(selectContent);
    console.log(content)
    const [style, setStyle] = React.useState(0);
    const [notebookView, setNotebookView] = React.useState(0);
    const exportNotebook = () => {
        const state = store.getState();
        vscode.postMessage({
            content: state,
            command: "export state"
        });
    };
    return <div>
        <ButtonGroup id="notebook-toolbar">
        <DropdownButton title="Notebook Style" className="notebook-toolbar-btn">
            <Dropdown.Item as="button"  onClick={() => { setNotebookView(0)}}>Article View</Dropdown.Item>
            <Dropdown.Item as="button" onClick={() => { setNotebookView(1)}}>Slide View</Dropdown.Item>
        </DropdownButton>
        <DropdownButton className="notebook-toolbar-btn" title="Diff Style">
            <Dropdown.Item as="button" onClick={() => { setStyle(0)}}>Original Diff</Dropdown.Item>
            <Dropdown.Item as="button" onClick={() => { setStyle(1)}}>Highlight Modified</Dropdown.Item>
            <Dropdown.Item as="button" onClick={() => { setStyle(2)}}>Diff Only</Dropdown.Item>
        </DropdownButton>
        {isExtension &&
                <Button className="notebook-toolbar-btn" onClick={exportNotebook}>Export</Button>
        }
        </ButtonGroup>
        {notebookView === 0?
        <div>
        {content.map((cell, index) => 
        <Cell content={cell} index={index} key={index} cstyle={style} mdOnly={cell.result.length===0}/>
        )}
        </div>
        :
        <Slide cstyle={style}></Slide>    
    }

    </div>;
}