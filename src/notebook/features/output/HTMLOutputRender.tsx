import { CellProps } from "../notebook/Cell";
import * as React from 'react';
import { ProgressBar } from "react-bootstrap";
import { isExtension, vscode } from "../../utils";
import unique from 'unique-selector';


export const HTMLOutputRender = (props: CellProps) => {
    const iframeWrapperRef = React.createRef<HTMLDivElement>();
    const recordRef = React.createRef<HTMLLIElement>();
    const playRef = React.createRef<HTMLLIElement>();

    const item = props.content.result[0];
    const [iframeDocument, setIframeDocument] = React.useState(null);
    const [progress, setProgress] = React.useState(0);
    const [recording, setRecording] = React.useState(props.content.recording ? JSON.parse(props.content.recording) : { events: [], startTime: -1 });
    // config
    const SPEED = 1;
    let isRecord = false;

    React.useEffect(() => {
        let iframeEle = iframeWrapperRef.current.childNodes[0] as HTMLIFrameElement;
        iframeEle.addEventListener('load', onOutputLoad);
        let iframeDoc = iframeEle.contentDocument;
        const processedHTML = processDocument();
        iframeDoc.open();
        iframeDoc.writeln(processedHTML);
        iframeDoc.close();
        processDocument();
    }, [props.content]);

    const processDocument = () => {
        const htmlDocuments = props.content.result.filter((e)=> e.format === 'html');
        let mainHTMLDocument = htmlDocuments[0]?.content;
        
        // match the script name
        const jsRegex = /<script src=(.*.js?).><\/script>/g
        const cssRegex = /<link rel=.stylesheet.* href=(.*\.css?).>/g;
        const jsResults = [...mainHTMLDocument.matchAll(jsRegex)];
        jsResults.forEach(line => {
            const jsLine = line[0];
            const fileName = line[1].replace(/"|\\/g, '');
            const jsDocument = props.content.result.filter((e) => e.title === fileName);
            const jsDocumentContent = jsDocument[0]?.content;
            mainHTMLDocument = mainHTMLDocument.replace(jsLine, `<script>${jsDocumentContent}</script>`);
        });

        const cssResults = [...mainHTMLDocument.matchAll(cssRegex)];
        cssResults.forEach(line => {
            const cssLine = line[0];
            const fileName = line[1].replace(/"|\\/g, '');
            const cssDocument = props.content.result.filter((e) => e.title === fileName);
            const cssDocumentContent = cssDocument[0]?.content;
            mainHTMLDocument = mainHTMLDocument.replace(cssLine, `<style>${cssDocumentContent}</style>`);
        });
        return mainHTMLDocument;
    };

    const onOutputLoad = (e) => {
        setIframeDocument(e.target.contentWindow.document.body);
        const style = document.createElement('style');
        style.innerHTML = `
        .cursor {
            border-radius: 50%;
            background: blue;
            width: 10px;
            height: 10px;
            position: fixed;
            top: 0;
            left: 0;
        }
        .click {
            border-radius: 50%;
            background: blue;
            position: fixed;
            width: 20px;
            height: 20px;
        }
        
        .clicked {
            border: 2px solid blue;
        }
        `;
        e.target.contentWindow.document.head.appendChild(style);
    };

    const handlers = [
        {
            eventName: "mousemove",
            handler: function handleMouseMove(e) {
                recording.events.push({
                    type: "mousemove",
                    x: e.pageX,
                    y: e.pageY,
                    time: Date.now()
                });
                setRecording(recording);
            }
        },
        {
            eventName: "click",
            handler: function handleClick(e) {
                recording.events.push({
                    type: "click",
                    target: serializeDOM(e.target),
                    x: e.pageX,
                    y: e.pageY,
                    time: Date.now()
                });
                setRecording(recording);
            }
        },
        {
            eventName: "keypress",
            handler: function handleKeyPress(e) {
                recording.events.push({
                    type: "keypress",
                    target: serializeDOM(e.target),
                    value: e.target.value,
                    keyCode: e.keyCode,
                    time: Date.now()
                });
                setRecording(recording);
            }
        }
    ];

    const serializeDOM = (el: HTMLElement) => {
        return unique(el);
    };

    const parseDOM = (selector, parentNode) => {
        return parentNode.querySelector(selector);
    };

    const startRecord = () => {
        recording.startTime = Date.now();
        recording.events = [];
        setRecording(recording)
        handlers.map(x => listen(x.eventName, x.handler));
    };
    const stopRecord = () => {
        handlers.map(x => removeListener(x.eventName, x.handler));
    };

    function listen(eventName, handler) {
        // listens even if stopPropagation
        return iframeDocument.addEventListener(eventName, handler, true);
    }

    function removeListener(eventName, handler) {
        // removes listen even if stopPropagation
        return iframeDocument.removeEventListener(
            eventName,
            handler,
            true
        );
    }

    const startPlay = () => {
        if (recording.events.length === 0) return;

        const fakeCursor = document.createElement('div');
        fakeCursor.className = 'cursor';

        iframeDocument.append(fakeCursor);
        let i = 0;
        const startPlay = Date.now();
        (function draw() {
            let event = recording.events[i];
            if (!event) {
                return;
            }
            let offsetRecording = event.time - recording.startTime;
            let offsetPlay = (Date.now() - startPlay) * SPEED;
            let totalTime = recording.events[recording.events.length - 1].time - recording.startTime;
            setProgress(offsetPlay / totalTime * 100);
            if (offsetPlay >= offsetRecording) {
                drawEvent(event, fakeCursor);
                i++;
            }

            if (i < recording.events.length) {
                requestAnimationFrame(draw);
            } else {
                setProgress(0);
                iframeDocument.removeChild(fakeCursor);
            }
        })();
    };

    const handleRecord = (e) => {
        if (isRecord) {
            stopRecord();
            // e.target.innerText = "Start Record";
            playRef.current.classList.toggle('stop');
            recordRef.current.innerHTML = '<i class="codicon codicon-record"></i>';
            recordRef.current.classList.toggle('active');
            vscode.postMessage({
                content: JSON.stringify(recording),
                command: "save recording",
                id: props.content.hash
            });
        }
        else {
            startRecord();
            playRef.current.classList.toggle('stop');
            recordRef.current.innerHTML = '<i class="codicon codicon-stop-circle"></i>';
            recordRef.current.classList.toggle('active');
        }
        isRecord = !isRecord;
    };

    const drawEvent = (event, fakeCursor: HTMLDivElement) => {
        if (event.type === "click" || event.type === "mousemove") {
            fakeCursor.style.top = event.y.toString() + 'px'
            fakeCursor.style.left = event.x.toString() + 'px'
        }

        if (event.type === "click") {
            let target = parseDOM(event.target, iframeDocument)
            flashClass(fakeCursor, "click");
            flashClass(target, "clicked");
            var clickEvent = document.createEvent("MouseEvents");
            clickEvent.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0,
                false, false, false, false, 0, null);
            target.dispatchEvent(clickEvent)
        }
    };
    const flashClass = (el: HTMLElement, className) => {
        el?.classList?.add(className)
        setTimeout(() => {
            el?.classList?.remove(className);
        }, 200);
    };
    const reload = () => {
        iframeWrapperRef.current.innerHTML = '<iframe> <iframe/>';
        let iframeEle = iframeWrapperRef.current.childNodes[0] as HTMLIFrameElement;
        iframeEle.addEventListener('load', onOutputLoad);
        let iframeDoc = iframeEle.contentDocument;
        iframeDoc.open();
        iframeDoc.writeln(item.content);
        iframeDoc.close();
    };

    return <div>
        <div className="preview-cell-wrapper" id={`preview-cell-wrapper-${props.content.hash}`}>
            <div>
                <ul className='toolbar-wrapper'>
                    <li className='wrapper-button' onClick={reload}><i className="codicon codicon-refresh"></i></li>
                    {isExtension &&
                        <li className='wrapper-button' onClick={handleRecord} ref={recordRef}><i className="codicon codicon-record"></i></li>
                    }
                    <li className='wrapper-button' onClick={startPlay} ref={playRef}><i className="codicon codicon-play"></i></li>
                    <li className='wrapper-progress' ><ProgressBar now={progress} /></li>
                </ul>
            </div>
            <div id="wrapper" ref={iframeWrapperRef}>
                <iframe></iframe>
            </div>
        </div>
    </div>;
};