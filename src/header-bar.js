import React, { useContext, useEffect } from 'react';
import {
    Appbar,
    AppbarAction,
    AppbarBackAction,
    AppbarContent
} from '@codexporer.io/expo-appbar';
import {
    useEditingMode,
    useSetEditingMode,
    useImageData,
    useSetIsProcessing,
    EditingMode,
    EditorMode
} from './state';
import { EditorContext } from './editor-context';
import { usePerformCrop } from './operation-bar/operations/use-perform-crop';

export const HeaderBar = () => {
    const editingMode = useEditingMode();
    const setEditingMode = useSetEditingMode();
    const imageData = useImageData();
    const setIsProcessing = useSetIsProcessing();
    const {
        mode,
        onCloseEditor,
        onEditingComplete
    } = useContext(EditorContext);

    const performCrop = usePerformCrop();

    const shouldDisableDoneButton = editingMode !== EditingMode.Select &&
        mode !== EditorMode.CropOnly;

    const onFinishEditing = async () => {
        if (mode === EditorMode.CropOnly) {
            await performCrop();
            return;
        }

        setIsProcessing(false);
        onEditingComplete?.(imageData);
        onCloseEditor?.();
    };

    const canClose = mode === EditorMode.CropOnly || editingMode === EditingMode.Select;
    const onPressBack = () => {
        if (canClose) {
            onCloseEditor?.();
            return;
        }

        setEditingMode(EditingMode.Select);
    };

    // Complete the editing process if we are in crop only mode after the editingMode gets set
    // back to operation select (happens internally in usePerformCrop) - can't do it in onFinishEditing
    // else it gets stale state - may need to refactor the hook as this feels hacky
    useEffect(() => {
        if (mode === EditorMode.CropOnly && imageData.uri && editingMode === EditingMode.Select) {
            onEditingComplete?.(imageData);
            onCloseEditor?.();
        }
    }, [
        mode,
        imageData,
        editingMode,
        onEditingComplete,
        onCloseEditor
    ]);

    return (
        <Appbar>
            {canClose && (
                <AppbarAction
                    icon='close'
                    onPress={onPressBack}
                />
            )}
            {!canClose && (
                <AppbarBackAction
                    onPress={onPressBack}
                />
            )}
            <AppbarContent />
            <AppbarAction
                icon='check'
                onPress={onFinishEditing}
                disabled={shouldDisableDoneButton}
            />
        </Appbar>
    );
};
