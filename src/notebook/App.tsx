import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { InputBox } from './features/inputbox/InputBox';
import { Instruction } from './features/instruction/Instruction';
import { Notebook } from './features/notebook/Notebook';
import { appendContent } from './features/notebook/notebookSlice';
import { vscode } from './utils';
export function App() {
    const dispatch = useDispatch();
    // using the useEffect hock to set Event Listener
    useEffect(() => {
        // send message back
        vscode.postMessage({
            command: "ready"
        });
        const handleMessage = (event) => {
             switch (event.data.command) {
                case "append":
                    dispatch(appendContent(event.data.content));
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        }; // run code when the component unmounts
    }, []);


    return <div>
        <InputBox />
        <Instruction />
        <Notebook />
    </div>;
}