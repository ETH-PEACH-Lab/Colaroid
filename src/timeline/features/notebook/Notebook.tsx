import * as React from "react";
import { useAppSelector } from "../../app/hooks";
import { selectContent } from "./notebookSlice";
import { Pagination } from "react-bootstrap";
import { vscode } from '../../utils';
import MarkdownView from 'react-showdown';
import { Output } from "../output/Output";

export const Notebook = () => {
    const content = useAppSelector(selectContent);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    React.useEffect(()=>{
        if(content.length > 0) {
            handleSwitch(0);
        }
    }, [content]);
    const handleSwitch = (index) => {
        setCurrentIndex(index);
        vscode.postMessage({
            command: "revert snapshot",
            id: content[index].hash,
            pid: content[index-1]?.hash
        });
    };
    return <div className="notebook-wrapper">
        <Pagination>
            {content.map((cell, index) =>
                <Pagination.Item
                    key={index}
                    active={index === currentIndex}
                    onClick={() => { handleSwitch(index); }}>
                    {index}
                </Pagination.Item>
            )}
        </Pagination>
        <MarkdownView markdown={content[currentIndex]?.message} options={{ tables: true, emoji: true }} />
        <Output content={content[currentIndex]} index={currentIndex}></Output>
    </div>;
};