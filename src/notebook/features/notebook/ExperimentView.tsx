import * as React from 'react';
import { useAppDispatch } from '../../app/hooks';
import { updateExperimentCondition, updateViewOption } from './notebookSlice';
import { Alert, ButtonGroup, ToggleButton } from 'react-bootstrap';
interface IExperimentConditionProps {
    link: string
}

export function ExperimentView(props: IExperimentConditionProps) {

    return <div className="experiment-container">
        {props.link === '' ?
            <Alert variant="secondary">
                Content not available
            </Alert>
            :
            <iframe src={props.link} frameBorder="0"></iframe>
        }
    </div>;
}