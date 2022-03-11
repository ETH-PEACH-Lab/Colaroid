import * as React from 'react';
import { useAppSelector } from '../../app/hooks';
import { store } from '../../app/store';
import { selectContent } from './notebookSlice';
import { Cell } from './Cell';
import { Button, ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap';
import { vscode } from '../../utils';
import { Slide } from '../slide/Slide';
export function Notebook() {
    const content = useAppSelector(selectContent);
    const [notebookView, setNotebookView] = React.useState(0);
    const exportNotebook = () => {
        const state = store.getState();
        vscode.postMessage({
            content: state,
            command: "export state"
        });
    };
    return <div className="notebook-container">
        {notebookView === 0 ?
            <div>
                {content.map((cell, index) =>
                    <Cell content={cell} index={index} key={index} mdOnly={cell.result.length === 0} />
                )}
            </div>
            :
            <Slide></Slide>
        }

    </div>;
}