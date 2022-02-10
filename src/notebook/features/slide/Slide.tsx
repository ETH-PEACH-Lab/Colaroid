import * as React from 'react';
import { useEffect } from 'react';
import { Col, Pagination, Row } from 'react-bootstrap';
import MarkdownView from 'react-showdown';
import { useAppSelector } from '../../app/hooks';
import { CellEditor } from '../notebook/CellEditor';
import { selectContent } from '../notebook/notebookSlice';
import { Output } from '../output/Output';

export function Slide(props) {
    const content = useAppSelector(selectContent);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowRight' && currentIndex < content.length - 1) setCurrentIndex(currentIndex + 1);
        if (event.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(currentIndex - 1);
    }
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    })
    return <div>
        <Pagination>
            {content.map((cell, index) =>
                <Pagination.Item
                    key={index}
                    active={index === currentIndex}
                    onClick={() => { setCurrentIndex(index); }}>
                    {index}
                </Pagination.Item>
            )}
        </Pagination>
        <div className="slide-wrapper">
            <Row>
                <Col sm={4}>
                    <div className="mdlist-wrapper">
                        {content.map((cell, index) =>
                            <div className={index === currentIndex ? "selectedwrapper" : "mdwrapper"} key={index}>
                                <MarkdownView markdown={cell?.message} options={{ tables: true, emoji: true }} onClick={() => { setCurrentIndex(index) }} />
                            </div>
                        )}
                    </div>
                </Col>
                <Col sm={8}>
                    <CellEditor content={content[currentIndex]} index={currentIndex} mdOnly={false} style={0}/>
                    <Output content={content[currentIndex]} index={currentIndex} mdOnly={false}></Output>
                </Col>
            </Row>
        </div>
    </div>;
}
