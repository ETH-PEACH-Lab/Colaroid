import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CellData, deleteCell, moveCellDown, moveCellUp, selectContent } from "./notebookSlice";
import { Button } from 'react-bootstrap';
import { vscode } from '../../utils';
import { current } from 'immer';

interface CellToolbarProps {
    hash: string
}
export function CellToolbar(props: CellToolbarProps) {
    const content = useAppSelector(selectContent);
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
        const currentIndex = findIndex();
        if (currentIndex > 0) {
            dispatch(moveCellUp(currentIndex));
            vscode.postMessage({
                command: "move up cell",
                id: props.hash,
            });
        }
    };

    const moveDownHandler = () => {
        const currentIndex = findIndex();
        if (currentIndex < content.length - 1) {
            dispatch(moveCellDown(currentIndex));
            vscode.postMessage({
                command: "move down cell",
                id: props.hash,
            });
        }
    };

    const revertHandler = () => {
        vscode.postMessage({
            command: "revert snapshot",
            id: props.hash,
        });
    };

    const findIndex = () => {
        let target;
        content.forEach((e, index) => {
            if (e.hash === props.hash) {
                target = index;
            }
        });
        return target;
    };

    return <div>
        <ul className='toolbar-wrapper' id={`toolbar-wrapper-${props.hash}`}>
            <li className='wrapper-button' onClick={revertHandler}><i className="codicon codicon-file-code"></i></li>
            {/* <li className='wrapper-button toggle-button' onClick={toggleHandler}></li> */}
            <li className='wrapper-button' onClick={moveUpHandler}><i className="codicon codicon-arrow-up"></i></li>
            <li className='wrapper-button' onClick={moveDownHandler}><i className="codicon codicon-arrow-down"></i></li>
            <li className='wrapper-button' onClick={deleteHandler}><i className="codicon codicon-trash"></i></li>

        </ul>
    </div>;
}