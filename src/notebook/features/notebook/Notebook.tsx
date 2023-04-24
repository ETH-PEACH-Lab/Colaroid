import * as React from 'react';
import { useAppSelector } from '../../app/hooks';
import { store } from '../../app/store';
import { selectContent, selectExperimentCondition, selectExperimentSetting } from './notebookSlice';
import { Cell } from './Cell';
import { Button, ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap';
import { vscode } from '../../utils';
import { Slide } from '../slide/Slide';
import { ViewOption } from './ViewOption';
import { ExperimentView } from './ExperimentView';
export function Notebook() {
    const content = useAppSelector(selectContent);
    // const experimentCondition = useAppSelector(selectExperimentCondition);
    // const experimentSetting = useAppSelector(selectExperimentSetting);
    const [notebookView, setNotebookView] = React.useState(0);
    const exportNotebook = () => {
        const state = store.getState();
        vscode.postMessage({
            content: state,
            command: "export state"
        });
    };
    return <div className="notebook-container">
        {notebookView === 0 ?
            <div>
                <ViewOption></ViewOption>
                <button onClick={exportNotebook}>Export</button>
                {/* {experimentCondition === '1' && */}
                    <div>
                {content.map((cell, index) =>
                    <Cell content={cell} index={index} key={index} mdOnly={cell.result.length === 0} />
                )}
                    </div>
                {/* // }
                // {experimentCondition === '2' &&
                //     <ExperimentView link={experimentSetting.video}/>
                // }
                // {experimentCondition === '3' &&
                //     <ExperimentView link={experimentSetting.article}/>
                // } */}
            </div>
            :
            <Slide></Slide>
        }

    </div>;
}