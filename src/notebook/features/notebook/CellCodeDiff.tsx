import * as React from "react";
import MonacoEditor, {
  EditorConstructionOptions,
  monaco,
  MonacoDiffEditor,
} from "react-monaco-editor";
export interface CellCodeDiffProps {
  language: string;
  current: string;
  original: string;
  style: number;
  theme?: string;
}
export function CellCodeDiff(props: CellCodeDiffProps) {
  let editor = null;
  let changes = [];
  const [editorHeight, setEditorHeight] = React.useState("150px");
  const options = {
    cursorBlinking: "smooth",
    folding: true,
    lineNumbersMinChars: 4,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    // Render the diff inline
    renderSideBySide: false,
    renderIndicators: false,
    renderOverviewRuler: false,
  };

  const editorDidMount = (editor) => {
    editor.onDidUpdateDiff(() => {
      const changes = editor.getLineChanges();
      if (changes.length > 0) {
        const startNumber = changes[0].originalStartLineNumber;
        editor.revealLineNearTop(startNumber);
      }
    });
    const original_lines = editor.getOriginalEditor().getModel().getLineCount();
    const modified_lines = editor.getModifiedEditor().getModel().getLineCount();
    const lines =
      original_lines > modified_lines ? original_lines : modified_lines;
    setEditorHeight(computeEditorHeight(lines));
  };

  const computeEditorHeight = (lines) => {
    if (lines >= 14) return "250px";
    if (lines <= 8) return "150px";
    return (lines * 19).toString() + "px";
  };

  const editorDidMount2 = (myeditor, monaco) => {
    editor = myeditor;
    renderDiff(myeditor, changes);
    setEditorHeight(computeEditorHeight(editor.getModel().getLineCount()));
  };
  const diffEditorDidMount = (myeditor, monaco) => {
    myeditor.onDidUpdateDiff(() => {
      const mychanges = myeditor.getLineChanges();
      changes = mychanges;
      renderDiff(editor, mychanges);
    });
  };
  const renderDiff = (myeditor, mychanges) => {
    // todo: add a red mark when lines are deleted
    if (myeditor && mychanges.length > 0) {
      mychanges.forEach((mychange) => {
        if (mychange.modifiedStartLineNumber < mychange.modifiedEndLineNumber) {
          myeditor.deltaDecorations(
            [],
            [
              {
                range: new monaco.Range(
                  mychange.modifiedStartLineNumber,
                  1,
                  mychange.modifiedEndLineNumber,
                  1
                ),
                options: {
                  isWholeLine: true,
                  linesDecorationsClassName: "myLineDecoration",
                  inlineClassName: "myInlineDecoration",
                },
              },
            ]
          );
        }
      });
      myeditor.revealLineNearTop(mychanges[0].modifiedStartLineNumber);
    }
  };
  const editorDidMount3 = (editor, monaco) => {
    const oLineCount = editor.getOriginalEditor().getModel().getLineCount();
    const mLineCount = editor.getModifiedEditor().getModel().getLineCount();
    let oLineRemain = oLineCount;
    let mLineRemain = mLineCount;
    editor.onDidUpdateDiff(() => {
      const changes = editor.getLineChanges();
      let oPrevLine = 1;
      let mPrevLine = 1;
      let originalHiddenArea = [] as any;
      let modifiedHiddenArea = [] as any;
      changes.forEach((change) => {
        let oChangeStart;
        let mChangeStart;
        // if add lines
        if (change.originalEndLineNumber === 0) {
          oChangeStart = change.originalStartLineNumber - 1;
          mChangeStart = change.modifiedStartLineNumber - 2;
          if (oChangeStart > oPrevLine) {
            originalHiddenArea.push(
              new monaco.Range(oPrevLine, 1, oChangeStart, 1)
            );
            oLineRemain = oLineRemain - (oChangeStart - oPrevLine + 1);
          }
          if (mChangeStart > mPrevLine) {
            modifiedHiddenArea.push(
              new monaco.Range(mPrevLine, 1, mChangeStart, 1)
            );
            mLineRemain = mLineRemain - (mChangeStart - mPrevLine + 1);
          }
          oPrevLine = change.originalStartLineNumber + 2;
          mPrevLine = change.modifiedEndLineNumber + 2;
        }

        // if delete lines
        if (change.modifiedEndLineNumber === 0) {
          oChangeStart = change.originalStartLineNumber - 2;
          mChangeStart = change.modifiedStartLineNumber - 1;
          if (oChangeStart > oPrevLine) {
            originalHiddenArea.push(
              new monaco.Range(oPrevLine, 1, oChangeStart, 1)
            );
            oLineRemain = oLineRemain - (oChangeStart - oPrevLine + 1);
          }
          if (mChangeStart > mPrevLine) {
            modifiedHiddenArea.push(
              new monaco.Range(mPrevLine, 1, mChangeStart, 1)
            );
            mLineRemain = mLineRemain - (mChangeStart - mPrevLine + 1);
          }
          oPrevLine = change.originalEndLineNumber + 2;
          mPrevLine = change.modifiedStartLineNumber + 2;
        }

        // if modify lines
        if (
          change.originalEndLineNumber !== 0 &&
          change.modifiedEndLineNumber !== 0
        ) {
          oChangeStart = change.originalStartLineNumber - 1;
          mChangeStart = change.modifiedStartLineNumber - 1;
          if (oChangeStart > oPrevLine) {
            originalHiddenArea.push(
              new monaco.Range(oPrevLine, 1, oChangeStart, 1)
            );
            oLineRemain = oLineRemain - (oChangeStart - oPrevLine);
          }
          if (mChangeStart > mPrevLine) {
            modifiedHiddenArea.push(
              new monaco.Range(mPrevLine, 1, mChangeStart, 1)
            );
            mLineRemain = mLineRemain - (mChangeStart - mPrevLine);
          }
          oPrevLine = change.originalEndLineNumber + 2;
          mPrevLine = change.modifiedEndLineNumber + 2;
        }
      });

      if (oPrevLine < oLineCount) {
        originalHiddenArea.push(new monaco.Range(oPrevLine, 1, oLineCount, 1));
        oLineRemain = oLineRemain - (oLineCount - oPrevLine + 1);
      }
      if (mPrevLine < mLineCount) {
        modifiedHiddenArea.push(new monaco.Range(mPrevLine, 1, mLineCount, 1));
        mLineRemain = mLineRemain - (mLineCount - mPrevLine + 1);
      }
      editor.getOriginalEditor().setHiddenAreas(originalHiddenArea);
      editor.getModifiedEditor().setHiddenAreas(modifiedHiddenArea);
      const lines = oLineRemain > mLineRemain ? oLineRemain : mLineRemain;
      setEditorHeight(computeEditorHeight(lines));
    });
  };

  return (
    <div>
      {props.style === 0 && (
        <div style={{ height: editorHeight }}>
          <MonacoDiffEditor
            language={props.language}
            options={
              { ...options, readOnly: true } as EditorConstructionOptions
            }
            theme={props.theme}
            original={props.original}
            value={props.current}
            editorDidMount={editorDidMount}
          />
        </div>
      )}
      {props.style === 1 && (
        <div style={{ height: editorHeight }}>
          <MonacoEditor
            value={props.current}
            options={
              { ...options, readOnly: true } as EditorConstructionOptions
            }
            theme={props.theme}
            language={props.language}
            editorDidMount={editorDidMount2}
          />
          <div style={{ display: "none" }}>
            {" "}
            <MonacoDiffEditor
              language={props.language}
              options={
                { ...options, readOnly: true } as EditorConstructionOptions
              }
              theme={props.theme}
              original={props.original}
              value={props.current}
              editorDidMount={diffEditorDidMount}
            />
          </div>
        </div>
      )}
      {props.style === 2 && (
        <div style={{ height: editorHeight }}>
          <MonacoDiffEditor
            language={props.language}
            options={
              { ...options, readOnly: true } as EditorConstructionOptions
            }
            theme={props.theme}
            original={props.original}
            value={props.current}
            editorDidMount={editorDidMount3}
          />
        </div>
      )}
    </div>
  );
}
