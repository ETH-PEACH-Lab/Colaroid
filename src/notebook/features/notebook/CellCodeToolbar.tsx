import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { deleteCell, selectContent, updateActiveEdit, selectActiveEdit } from "./notebookSlice";
import { vscode } from '../../utils';
import { Dropdown } from 'react-bootstrap';

interface CellToolbarProps {
    hash: string,
    index: number,
    mdOnly: boolean
    switchStyle
}
export function CellCodeToolbar(props: CellToolbarProps) {
    const content = useAppSelector(selectContent);
    const activeEdit = useAppSelector(selectActiveEdit);
    const [isEditing, setIsEditing] = React.useState(false);
    const dispatch = useAppDispatch();

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


    return <div className="toolbar-container">
        <ul className='toolbar-wrapper' id={`toolbar-wrapper-${props.hash}`}>
            {!props.mdOnly &&
                <li className={activeEdit === findIndex() ? "wrapper-button is-edit" : "wrapper-button"} onClick={editHandler} title={activeEdit === findIndex() ? "Save Edits" : "Edit"}><i className={activeEdit === findIndex() ? "codicon codicon-save-as" : "codicon codicon-edit"}></i></li>
            }
            {!props.mdOnly &&
                <li className='wrapper-dropdown' title="Switch View">
                    <Dropdown>
                        <Dropdown.Toggle className="dropdown-codeview">
                            <i className='codicon codicon-preview'></i>
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item as="button" onClick={() => props.switchStyle(0)}>Diff in Context</Dropdown.Item>
                            <Dropdown.Item as="button" onClick={() => props.switchStyle(2)}>Diff Only</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </li>
            }

        </ul>
    </div>;
}