import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CellData, deleteCell, moveCellDown, moveCellUp, selectContent, updateActiveEdit, selectActiveEdit } from "./notebookSlice";
import { vscode } from '../../utils';

interface CellToolbarProps {
    hash: string,
    index: number,
    mdOnly: boolean
    switchStyle
}
export function CellToolbar(props: CellToolbarProps) {
    const content = useAppSelector(selectContent);
    const activeEdit = useAppSelector(selectActiveEdit);
    const [isEditing, setIsEditing] = React.useState(false);
    const [styleIcon, setStyleIcon] = React.useState('codicon-diff-added')
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
        if (isEditing) {
            vscode.postMessage({
                command: "finish editing",
                id: props.hash,
                index: props.index
            });
            dispatch(updateActiveEdit(-1));
        }
        else {
            vscode.postMessage({
                command: "start editing",
                id: props.hash,
            });
            dispatch(updateActiveEdit(findIndex()));
        }
        setIsEditing(!isEditing);
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

    const switchView = () => {
        let style = props.switchStyle();
        switch (style) {
            case 0:
                setStyleIcon('codicon-code');
                break;
            case 1:
                setStyleIcon('codicon-diff-removed');
                break;
            case 2:
                setStyleIcon('codicon-diff-added');
                break;
        }
    }

    return <div style={{ overflow: 'auto' }}>
        <ul className='toolbar-wrapper' id={`toolbar-wrapper-${props.hash}`}>
            {!props.mdOnly &&
                <li className='wrapper-button' onClick={revertHandler}><i className="codicon codicon-file-code"></i></li>
            }
            {!props.mdOnly &&
                <li className='wrapper-button' onClick={editHandler}><i className={activeEdit === findIndex() ? "codicon codicon-save-as" : "codicon codicon-edit"}></i></li>
            }
            {!props.mdOnly &&
                <li className='wrapper-button' onClick={switchView}><i className={`codicon ${styleIcon}`}></i></li>
            }
            <li className='wrapper-button' onClick={moveUpHandler}><i className="codicon codicon-arrow-up"></i></li>
            <li className='wrapper-button' onClick={moveDownHandler}><i className="codicon codicon-arrow-down"></i></li>
            <li className='wrapper-button' onClick={deleteHandler}><i className="codicon codicon-trash"></i></li>

        </ul>
    </div>;
}