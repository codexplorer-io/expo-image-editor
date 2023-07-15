import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTheme, Text } from 'react-native-paper';

const Root = styled.View`
    height: 64px;
    width: 80px;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding-vertical: 8px;
    ${({ isDisabled }) => isDisabled && `
        opacity: 0.5;
    `}
`;

const Label = styled(Text)`
    color: ${({ theme }) => theme.colors.onPrimary};
    text-align: center;
`;

export const Icon = ({
    isDisabled = false,
    iconName,
    text
}) => {
    const theme = useTheme();
    return (
        <Root isDisabled={isDisabled}>
            <MaterialIcons
                name={iconName}
                size={26}
                color={theme.colors.onPrimary}
            />
            <Label>
                {text}
            </Label>
        </Root>
    );
};
