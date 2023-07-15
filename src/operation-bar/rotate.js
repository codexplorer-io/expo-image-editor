import React, { useState } from 'react';
import styled from 'styled-components/native';
import { IconButton } from '../icon-button';
import {
    EditingMode,
    useImageData,
    useSetEditingMode,
    useSetImageData
} from '../state';
import {
    usePerformRotate,
    RotationDirection
} from './operations/use-perform-rotate';
import {
    PromptLabel,
    OperationsRow
} from './styled';

const Root = styled.View`
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
`;

const RotationOperationsRow = styled.View`
    width: 100%;
    height: 80px;
    flex-direction: row;
    justify-content: space-between;
    alignItems: center;
    paddingHorizontal: 20%;
`;

export const Rotate = () => {
    const [originalImageData] = useState(useImageData());
    const setImageData = useSetImageData();
    const setEditingMode = useSetEditingMode();

    const onClose = () => {
        // If closing reset the image back to its original
        setImageData(originalImageData);
        setEditingMode(EditingMode.Select);
    };

    const rotate = usePerformRotate();

    return (
        <Root>
            <RotationOperationsRow>
                <IconButton
                    iconName='rotate-left'
                    text='Rotate -90'
                    onPress={() => rotate(RotationDirection.CCW)}
                />
                <IconButton
                    iconName='rotate-right'
                    text='Rotate +90'
                    onPress={() => rotate(RotationDirection.CW)}
                />
            </RotationOperationsRow>
            <OperationsRow>
                <IconButton
                    iconName='close'
                    text='Cancel'
                    onPress={() => onClose()}
                />
                <PromptLabel>Rotate</PromptLabel>
                <IconButton
                    iconName='check'
                    text='Done'
                    onPress={() => setEditingMode('operation-select')}
                />
            </OperationsRow>
        </Root>
    );
};
