import { createContext } from 'react';
import { EditorMode } from './state';

export const EditorContext = createContext({
    shouldThrottleBlur: true,
    minimumCropDimensions: {
        width: 0,
        height: 0
    },
    fixedAspectRatio: 1.6,
    isAspectRatioLocked: false,
    mode: EditorMode.Full,
    onCloseEditor: undefined,
    onEditingComplete: undefined,
    allowedTransformOperations: undefined,
    allowedAdjustmentOperations: undefined
});
