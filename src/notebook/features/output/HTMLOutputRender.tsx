import { CellProps } from "../notebook/Cell";
import * as React from 'react';
import { Button } from "react-bootstrap";
import { sleep } from "../../../colaroid/utils";


export const HTMLOutputRender = (props: CellProps) => {
    const iframeWrapperRef = React.createRef<HTMLDivElement>();
    const recordRef = React.createRef<HTMLButtonElement>();
    const playRef = React.createRef<HTMLButtonElement>();

    const item = props.content.result[0];
    const [iframeDocument, setIframeDocument] = React.useState(null);

    // config
    const SPEED = 1;
    let isRecord = false;
    let recording = { events: [], startTime: -1 };


    React.useEffect(() => {
        let iframeEle = iframeWrapperRef.current.childNodes[0] as HTMLIFrameElement;
        iframeEle.addEventListener('load', onOutputLoad);
        let iframeDoc = iframeEle.contentDocument;
        iframeDoc.open();
        iframeDoc.writeln(item.content);
        iframeDoc.close();
    }, []);

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
            }
        },
        {
            eventName: "click",
            handler: function handleClick(e) {
                recording.events.push({
                    type: "click",
                    target: e.target,
                    x: e.pageX,
                    y: e.pageY,
                    time: Date.now()
                });
            }
        },
        {
            eventName: "keypress",
            handler: function handleKeyPress(e) {
                recording.events.push({
                    type: "keypress",
                    target: e.target,
                    value: e.target.value,
                    keyCode: e.keyCode,
                    time: Date.now()
                });
            }
        }
    ];

    const startRecord = () => {
        recording.startTime = Date.now();
        recording.events = [];
        handlers.map(x => listen(x.eventName, x.handler));
    }
    const stopRecord = () => {
        handlers.map(x => removeListener(x.eventName, x.handler));
    }

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
        recordRef.current.disabled = true;
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
            if (offsetPlay >= offsetRecording) {
                drawEvent(event, fakeCursor);
                i++;
            }

            if (i < recording.events.length) {
                requestAnimationFrame(draw);
            } else {
                iframeDocument.removeChild(fakeCursor)
                recordRef.current.disabled = false;
            }
        })();
    };

    const handleRecord = (e) => {
        if (isRecord) {
            stopRecord();
            e.target.innerText = "Start Record";
            playRef.current.disabled = false;
        }
        else {
            startRecord();
            e.target.innerText = "Stop Record";
            playRef.current.disabled = true;
        }
        isRecord = !isRecord;
    };

    const drawEvent = (event, fakeCursor: HTMLDivElement) => {
        if (event.type === "click" || event.type === "mousemove") {
            fakeCursor.style.top = event.y.toString() + 'px'
            fakeCursor.style.left = event.x.toString() + 'px'
        }

        if (event.type === "click") {
            flashClass(fakeCursor, "click");
            flashClass(event.target, "clicked");
            var clickEvent = document.createEvent("MouseEvents");
            clickEvent.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0,
                false, false, false, false, 0, null);
            event.target.dispatchEvent(clickEvent)
        }
    };
    const flashClass = (el: HTMLElement, className) => {
        el.classList.add(className)
        setTimeout(() => {
            el.classList.remove(className)
        }, 200)
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
                <Button onClick={handleRecord} ref={recordRef}>Record</Button>
                <Button onClick={startPlay} ref={playRef}>Play</Button>
                <Button onClick={reload}>Reload</Button>
            </div>
            <div id="wrapper" ref={iframeWrapperRef}>
                <iframe></iframe>
            </div>
        </div>
    </div>;
};