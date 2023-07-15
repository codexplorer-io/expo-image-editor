import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from './icon';

export const IconButton = props => {
    const { text, iconName, ...buttonProps } = props;
    const iconProps = { text, iconName, isDisabled: buttonProps.isDisabled };
    return (
        <TouchableOpacity {...buttonProps}>
            <Icon {...iconProps} />
        </TouchableOpacity>
    );
};
