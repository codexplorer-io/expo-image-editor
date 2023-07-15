import React from 'react';
import styled from 'styled-components/native';
import { useTheme, ActivityIndicator } from 'react-native-paper';

const Root = styled.View`
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    justify-content: center;
    align-items: center;
    ${({ isOverlay, theme }) => isOverlay && `
        background-color: ${theme.colors.backdrop};
    `}
`;

export const Processing = ({ isOverlay = true }) => {
    const theme = useTheme();

    return (
        <Root isOverlay={isOverlay}>
            <ActivityIndicator
                size='large'
                color={theme.colors.primary}
            />
        </Root>
    );
};
