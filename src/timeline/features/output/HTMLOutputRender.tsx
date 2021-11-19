import * as React from 'react';


export const HTMLOutputRender = (props: any) =>{
    const iframeRef = React.createRef<HTMLIFrameElement>();
    const item = props.content.result[0];

    React.useEffect(()=>{
        let iframeDoc = iframeRef.current.contentDocument;
        iframeDoc.open();
        iframeDoc.writeln(item.content);
        iframeDoc.close();
    }, []);

    return <div>
        <div className="preview-cell-wrapper" id={`preview-cell-wrapper-${props.content.hash}`}>
            <iframe ref={iframeRef} ></iframe>
        </div>
    </div>;
};