import * as React from 'react';
import { ProgressBar } from 'react-bootstrap';
import unique from 'unique-selector';

export const HTMLOutputRender = (props: any) => {
    const iframeWrapperRef = React.createRef<HTMLDivElement>();
    const item = props.content.result[0];
    const [iframeDocument, setIframeDocument] = React.useState(null);
    const [progress, setProgress] = React.useState(0);
    const playRef = React.createRef<HTMLLIElement>();
    let recording = props.content.recording ? JSON.parse(props.content.recording) : { events: [], startTime: -1 } 


    const SPEED = 1;
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
            width: 15px;
            height: 15px;
        }
        
        .clicked {
            border: 2px solid blue;
        }
        `;
        e.target.contentWindow.document.head.appendChild(style);
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

    const startPlay = () => {
        if(recording.events.length === 0) return;
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

    const serializeDOM = (el: HTMLElement) => {
        return unique(el);
    };

    const parseDOM = (selector, parentNode) => {
        return parentNode.querySelector(selector);
    };
    const flashClass = (el: HTMLElement, className) => {
        el?.classList?.add(className)
        setTimeout(() => {
            el?.classList?.remove(className);
        }, 200);
    };
    return <div>
        <div className="preview-cell-wrapper" id={`preview-cell-wrapper-${props.content.hash}`}>
            <div>
                <ul className='toolbar-wrapper'>
                    <li className='wrapper-button' onClick={reload}><i className="codicon codicon-refresh"></i></li>
                    <li className='wrapper-button' onClick={startPlay} ref={playRef}><i className="codicon codicon-play"></i></li>
                    <li className='wrapper-progress' ><ProgressBar now={progress} /></li>
                </ul>
                <div id="wrapper" ref={iframeWrapperRef}>
                    <iframe></iframe>
                </div>
            </div>
        </div>
    </div>
};