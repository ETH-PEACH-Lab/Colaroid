import * as React from 'react';
import { useAppDispatch } from '../../app/hooks';
import { updateExperimentCondition, updateViewOption } from './notebookSlice';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import { vscode } from '../../utils';

export function ViewOption() {
    const [radioValue, setRadioValue] = React.useState('1');
    const [conditionValue, setConditionValue] = React.useState('1');

    const radios = [
        { name: 'Reading Mode', value: '1' },
        { name: 'Authoring Mode', value: '2' }
    ];

    const conditionRadios = [
        { name: 'Colaroid', value: '1' },
        { name: 'Video', value: '2' },
        { name: 'Article', value: '3' }
    ];
    const dispatch = useAppDispatch();

    const onViewChange = (value: string) => {
        dispatch(updateViewOption(value));
        setRadioValue(value);
        onConditionChange('1');
    };

    const onConditionChange = (value: string) => {
        dispatch(updateExperimentCondition(value));
        setConditionValue(value);
        if(value === '2') {
            console.log('switch to video')
            vscode.postMessage({
                command: "switch video"
            });
        }
        if(value === '3') {
            console.log("switch to article")
            vscode.postMessage({
                command: "switch article"
            });
        }
    };



    return <div className="viewoption-container">
        <ButtonGroup>
            {radios.map((radio, idx) => (
                <ToggleButton
                    className="view-btn"
                    key={idx}
                    id={`radio-${idx}`}
                    type="radio"
                    variant='outline-secondary'
                    name="radio"
                    value={radio.value}
                    checked={radioValue === radio.value}
                    onChange={(e) => onViewChange(e.currentTarget.value)}
                >
                    {radio.name}
                </ToggleButton>
            ))}
        </ButtonGroup>
        <div className="condition-btn-container">
        {radioValue === '1' &&
            <ButtonGroup>
                {conditionRadios.map((radio, idx) => (
                    <ToggleButton
                        className="view-btn"
                        key={idx}
                        id={`cradio-${idx}`}
                        type="radio"
                        variant='outline-secondary'
                        name="cradio"
                        value={radio.value}
                        checked={conditionValue === radio.value}
                        onChange={(e) => onConditionChange(e.currentTarget.value)}
                    >
                        {radio.name}
                    </ToggleButton>
                ))}
            </ButtonGroup>
        }
        </div>
    </div>;
}