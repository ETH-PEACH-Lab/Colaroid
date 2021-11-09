import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { InputBox } from './features/inputbox/InputBox';
import { Notebook } from './features/notebook/Notebook';
import { appendContent } from './features/notebook/notebookSlice';
export function App() {
    const dispatch = useDispatch();
    // using the useEffect hock to set Event Listener
    useEffect(() => {
        console.log('after loaded')
        const handleMessage = (event) => {
            console.log(event.data);
            switch (event.data.command) {
                case "append":
                    dispatch(appendContent(event.data.content));
                    break;
                default:
                    console.log(event.data);
            }
            // return function () {
            // 	if (data) {
            // 		switch (command) {
            // 			case "update":
            // 				updateDoc(monaco, data);
            // 				break;
            // 			default:
            // 				console.log("default");
            // 		}
            // 	}
            // 	hideStart();
            // };
        };
        // run code when anything in the array changes
        // window.addEventListener("message", (event) => {
        //     require(["vs/editor/editor.main"], handleMessage);
        // });
        window.addEventListener("message", handleMessage);
        return () => {
            console.log('remove listener')
            window.removeEventListener("message", handleMessage);
        }; // run code when the component unmounts
    }, []);


    return <div>
        <InputBox />
        <Notebook />
        <h1>It worked!!</h1>
    </div>;
}