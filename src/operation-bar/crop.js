import React from 'react';
import { IconButton } from '../icon-button';
import { usePerformCrop } from './operations/use-perform-crop';
import {
    EditingMode,
    useSetEditingMode
} from '../state';
import {
    PromptLabel,
    OperationsRow
} from './styled';

export const Crop = () => {
    const setEditingMode = useSetEditingMode();
    const onPerformCrop = usePerformCrop();

    return (
        <OperationsRow>
            <IconButton
                iconName='close'
                text='Cancel'
                onPress={() => setEditingMode(EditingMode.Select)}
            />
            <PromptLabel>Crop</PromptLabel>
            <IconButton
                iconName='check'
                text='Done'
                onPress={onPerformCrop}
            />
        </OperationsRow>
    );
};
