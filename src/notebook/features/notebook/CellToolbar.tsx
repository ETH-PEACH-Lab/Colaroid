import * as React from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  CellData,
  deleteCell,
  moveCellDown,
  moveCellUp,
  selectContent,
  updateActiveEdit,
  selectActiveEdit,
  selectViewOption,
} from "./notebookSlice";
import { vscode } from "../../utils";

interface CellToolbarProps {
  hash: string;
  index: number;
  mdOnly: boolean;
}
export function CellToolbar(props: CellToolbarProps) {
  const content = useAppSelector(selectContent);
  const activeEdit = useAppSelector(selectActiveEdit);
  const viewOption = useAppSelector(selectViewOption);

  const [isEditing, setIsEditing] = React.useState(false);
  const [styleIcon, setStyleIcon] = React.useState("codicon-diff-added");
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
        index: props.index,
      });
      dispatch(updateActiveEdit(-1));
    } else {
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

  return (
    <div className="toolbar-container">
      <ul className="toolbar-wrapper" id={`toolbar-wrapper-${props.hash}`}>
        {!props.mdOnly && viewOption === "1" && (
          <li
            className="wrapper-button"
            onClick={revertHandler}
            title="Go to this version"
          >
            <i className="codicon codicon-go-to-file"></i>
          </li>
        )}
        {/* <li className='wrapper-button' onClick={moveUpHandler} title="Move Up"><i className="codicon codicon-arrow-up"></i></li>

            <li className='wrapper-button' onClick={moveDownHandler} title="Move Down"><i className="codicon codicon-arrow-down" ></i></li> */}
        {viewOption === "2" && (
          <li className="wrapper-button" onClick={deleteHandler} title="Delete">
            <i className="codicon codicon-trash"></i>
          </li>
        )}
      </ul>
    </div>
  );
}
