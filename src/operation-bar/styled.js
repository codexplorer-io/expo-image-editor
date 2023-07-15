import styled from 'styled-components/native';
import { Text } from 'react-native-paper';

export const OperationsRow = styled.View`
    width: 100%;
    height: 80px;
    flex-direction: row;
    justify-content: space-between;
    alignItems: center;
    paddingHorizontal: 2%;
`;

export const PromptLabel = styled(Text)`
    color: ${({ theme }) => theme.colors.onPrimary};
    font-size: 16px;
    text-align: center;
    font-weight: 600;
`;
