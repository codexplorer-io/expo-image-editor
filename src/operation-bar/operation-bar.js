import React from 'react';
import styled from 'styled-components/native';
import { OperationSelection } from './operation-selection';
import { Crop } from './crop';
import { Rotate } from './rotate';
import { Blur } from './blur';
import {
    EditingMode,
    useEditingMode
} from '../state';

const Root = styled.View`
    height: 160px;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.primaryHighlight};
    justify-content: center;
`;

const OperationContainer = styled.View`
    height: 160px;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.primary};
    justify-content: center;
    position: absolute;
`;

export const OperationBar = () => {
    const editingMode = useEditingMode();

    const getOperationWindow = () => {
        switch (editingMode) {
            case EditingMode.Crop:
                return <Crop />;
            case EditingMode.Rotate:
                return <Rotate />;
            case EditingMode.Blur:
                return <Blur />;
            default:
                return null;
        }
    };

    return (
        <Root>
            <OperationSelection />
            {editingMode !== 'operation-select' && (
                <OperationContainer>
                    {getOperationWindow()}
                </OperationContainer>
            )}
        </Root>
    );
};
