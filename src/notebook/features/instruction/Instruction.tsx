import * as React from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectContent } from '../notebook/notebookSlice';
export const Instruction = () => {
    const content = useAppSelector(selectContent);

    return <div>
        {content.length === 0 &&
            <article id="start-container">
                <h1>Welcome to Colaroid!</h1>
                <p>Colaroid is designed for "literate programming" -- it allows you to embed code in a document to create computational narratives. It stands out from other computational notebooks as it is created for documenting code evolutions. Colaroid can be used for a variety of programming tasks where storytelling matters. </p>
                <p>Please start by inserting a snapshot.</p>
            </article>
        }
    </div>;
}