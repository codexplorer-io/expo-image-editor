import React, {
    useContext,
    useMemo
} from 'react';
import {
    TouchableOpacity,
    ScrollView
} from 'react-native';
import styled from 'styled-components/native';
import filter from 'lodash/filter';
import includes from 'lodash/includes';
import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import { Icon } from '../icon';
import { IconButton } from '../icon-button';
import { EditorContext } from '../editor-context';
import { useSetEditingMode } from '../state';

const operations = {
    transform: [
        {
            title: 'Crop',
            iconName: 'crop',
            operationID: 'crop'
        },
        {
            title: 'Rotate',
            iconName: 'rotate-90-degrees-ccw',
            operationID: 'rotate'
        }
    ],
    adjust: [
        {
            title: 'Blur',
            iconName: 'blur-on',
            operationID: 'blur'
        }
    ]
};

const OperationsRow = styled(ScrollView)`
    height: 80px;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.primary};
`;

const OperationContainer = styled.View`
    height: 100%;
    justify-content: center;
    align-items: center;
    margin-left: 16px;
`;

const ModesRow = styled.View`
    height: 80px;
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
`;

const ModeButton = styled(TouchableOpacity)`
    height: 80px;
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: ${({ isSelected, theme }) => isSelected ? theme.colors.primary : theme.colors.primaryDarker};
`;

export const OperationSelection = () => {
    const {
        allowedTransformOperations,
        allowedAdjustmentOperations
    } = useContext(EditorContext);

    const isTransformOnly = !isEmpty(allowedTransformOperations) &&
        isEmpty(allowedAdjustmentOperations);
    const isAdjustmentOnly = !isEmpty(allowedAdjustmentOperations) &&
        isEmpty(allowedTransformOperations);

    const [selectedOperationGroup, setSelectedOperationGroup] = React.useState(isAdjustmentOnly ? 'adjust' : 'transform');

    const setEditingMode = useSetEditingMode();

    const filteredOperations = useMemo(() => {
        // If neither are specified then allow the full range of operations
        if (isEmpty(allowedTransformOperations) && isEmpty(allowedAdjustmentOperations)) {
            return operations;
        }

        const filteredTransforms = allowedTransformOperations ?
            filter(
                operations.transform,
                op => includes(allowedTransformOperations, op.operationID)
            ) :
            operations.transform;
        const filteredAdjustments = allowedAdjustmentOperations ?
            filter(
                operations.adjust,
                op => includes(allowedAdjustmentOperations, op.operationID)
            ) :
            operations.adjust;

        if (isTransformOnly) {
            return { transform: filteredTransforms, adjust: [] };
        }

        if (isAdjustmentOnly) {
            return { adjust: filteredAdjustments, transform: [] };
        }

        return { transform: filteredTransforms, adjust: filteredAdjustments };
    }, [
        allowedTransformOperations,
        allowedAdjustmentOperations,
        isTransformOnly,
        isAdjustmentOnly
    ]);

    return (
        <>
            <OperationsRow horizontal>
                {
                    map(
                        filteredOperations[selectedOperationGroup],
                        item => (
                            <OperationContainer key={item.title}>
                                <IconButton
                                    text={item.title}
                                    iconName={item.iconName}
                                    onPress={() => setEditingMode(item.operationID)}
                                />
                            </OperationContainer>
                        )
                    )
                }
            </OperationsRow>
            {!isTransformOnly && !isAdjustmentOnly ? (
                <ModesRow>
                    <ModeButton
                        isSelected={selectedOperationGroup === 'transform'}
                        onPress={() => setSelectedOperationGroup('transform')}
                    >
                        <Icon iconName='transform' text='Transform' />
                    </ModeButton>
                    <ModeButton
                        isSelected={selectedOperationGroup === 'adjust'}
                        onPress={() => setSelectedOperationGroup('adjust')}
                    >
                        <Icon iconName='tune' text='Adjust' />
                    </ModeButton>
                </ModesRow>
            ) : null}
        </>
    );
};
