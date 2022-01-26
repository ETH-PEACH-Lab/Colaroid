import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { InputBox } from './features/inputbox/InputBox';
import { Instruction } from './features/instruction/Instruction';
import { Notebook } from './features/notebook/Notebook';
import { appendContent, initState, cleanContent } from './features/notebook/notebookSlice';
import { vscode, isExtension } from './utils';

export function App() {
    const dispatch = useDispatch();
    // using the useEffect hock to set Event Listener
    useEffect(() => {
        if (isExtension) {
            // send message back
            vscode.postMessage({
                command: "ready"
            });
            const handleMessage = (event) => {
                switch (event.data.command) {
                    case "append":
                        dispatch(appendContent(event.data.content));
                        break;
                    case "clean":
                        dispatch(cleanContent({}));
                        break;
                    default:
                        break;
                }
            };
            window.addEventListener("message", handleMessage);
            return () => {
                window.removeEventListener("message", handleMessage);
            }; // run code when the component unmounts
        }
        else {
            // load state from a JSON file
            fetch("../state/state.json")
                .then(response => {
                    return response.json();
                })
                .then(jsondata =>
                    {
                        dispatch(initState(jsondata.notebook));
                    }
                );
            const additional_style = document.createElement('style');
            additional_style.innerHTML = `
            :root {
                --vscode-editor-background: #1e1e1e;
                --vscode-editor-foreground: #d4d4d4;
                --vscode-editor-font-size: 12px;
                --vscode-editor-font-weight: normal;
            }
            body{
                padding: 20px 100px;
            }
            `
            document.head.appendChild(additional_style)
        }
    }, []);


    return <div>
        {isExtension ?
        <>
        <InputBox />
        <Instruction />
        <Notebook />
        </>:
        <Notebook />
        }
    </div>;
}