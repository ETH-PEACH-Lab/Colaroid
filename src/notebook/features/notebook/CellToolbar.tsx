import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CellData, deleteCell, moveCellDown, moveCellUp, selectContent } from "./notebookSlice";
import { vscode } from '../../utils';

interface CellToolbarProps {
    hash: string,
    index: number
}
export function CellToolbar(props: CellToolbarProps) {
    const content = useAppSelector(selectContent);
    const [isEditing, setIsEditing] = React.useState(false);
    const dispatch = useAppDispatch();
    const deleteHandler = () => {
        dispatch(deleteCell(props.hash));
        vscode.postMessage({
            command: "remove cell",
            id: props.hash,
        });
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

    const editHandler = () => {
        if(isEditing){
            vscode.postMessage({
                command: "edit snapshot",
                id: props.hash,
                index: props.index
            });
        }
        else {
            vscode.postMessage({
                command: "revert snapshot",
                id: props.hash,
            });
        }
        setIsEditing(!isEditing);
    }

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
            <li className='wrapper-button' onClick={editHandler}><i className={isEditing?"codicon codicon-save-as":"codicon codicon-edit"}></i></li>
            {/* <li className='wrapper-button toggle-button' onClick={toggleHandler}></li> */}
            <li className='wrapper-button' onClick={moveUpHandler}><i className="codicon codicon-arrow-up"></i></li>
            <li className='wrapper-button' onClick={moveDownHandler}><i className="codicon codicon-arrow-down"></i></li>
            <li className='wrapper-button' onClick={deleteHandler}><i className="codicon codicon-trash"></i></li>

        </ul>
    </div>;
}