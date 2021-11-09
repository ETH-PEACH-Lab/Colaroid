import * as React from 'react';
import { useAppDispatch } from '../../app/hooks';
import { CellData, deleteCell } from "./notebookSlice";
import { Button } from 'react-bootstrap';
import { vscode } from '../../utils';

interface CellToolbarProps {
    hash: string
}
export function CellToolbar(props: CellToolbarProps) {
    const dispatch = useAppDispatch();
    const deleteHandler = () => {
        dispatch(deleteCell(props.hash));
        vscode.postMessage({
            command: "remove cell",
            id: props.hash,
        });
    };

    const toggleHandler = () => {

    };


    const moveUpHandler = () => {

    };

    const moveDownHandler = () => {

    };

    const revertHandler = () => {

    };

    return <div>
        <div className='toolbar-wrapper' id={`toolbar-wrapper-${props.hash}`}>
            <Button className='wrapper-button delete-button' onClick={deleteHandler}></Button>
            <Button className='wrapper-button toggle-button' onClick={toggleHandler}></Button>
            <Button className='wrapper-button moveup-button' onClick={moveUpHandler}></Button>
            <Button className='wrapper-button movedown-button' onClick={moveDownHandler}></Button>
            <Button className='wrapper-button revert-button' onClick={revertHandler}></Button>
        </div>
    </div>;
}