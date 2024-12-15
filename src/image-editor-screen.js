import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { manipulateAsync } from 'expo-image-manipulator';
import styled from 'styled-components/native';
import { usePrevious } from '@codexporer.io/react-hooks';
import { HeaderBar } from './header-bar';
import { EditingWindow } from './editing-window';
import { Processing } from './processing';
import { OperationBar } from './operation-bar/operation-bar';
import {
    EditingMode,
    EditorMode,
    IMAGE_EDITOR_ROUTE_NAME,
    useCloseImageEditor,
    useImageEditorConfigImageUri,
    useImageEditorConfigMode,
    useImageEditorState,
    useIsProcessing,
    useIsReady,
    useResetEditorState,
    useSetEditingMode,
    useSetImageData,
    useSetIsReady
} from './state';

const ScreenRoot = styled.View`
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: ${({ theme }) => theme.colors.primary};
`;

const SafeArea = styled.SafeAreaView`
    display: flex;
    flex: 1;
`;

const ScreenContent = styled.View`
    display: flex;
    flex: 1;
    position: relative;
    background-color: ${({ theme }) => theme.colors.background};
`;

const ImageEditorViewContainer = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.imagePlaceholderBackground};
`;

export const ImageEditorScreen = () => {
    const isFocused = useIsFocused();
    const mode = useImageEditorConfigMode();
    const imageUri = useImageEditorConfigImageUri();
    const closeImageEditor = useCloseImageEditor();

    const setImageData = useSetImageData();
    const setIsReady = useSetIsReady();
    const isReady = useIsReady();
    const isProcessing = useIsProcessing();
    const setEditingMode = useSetEditingMode();

    // Initialise the image data when it is set through the props
    useEffect(() => {
        const initialise = async () => {
            if (imageUri) {
                const enableEditor = () => {
                    setIsReady(true);
                };

                const {
                    width,
                    height
                } = await manipulateAsync(imageUri, []);
                setImageData({
                    uri: imageUri,
                    width,
                    height
                });
                enableEditor();
            }
        };
        initialise();
    }, [
        imageUri,
        setImageData,
        setIsReady
    ]);

    useEffect(() => {
        if (mode === EditorMode.CropOnly) {
            setEditingMode(EditingMode.Crop);
        }
    }, [
        mode,
        setIsReady,
        setEditingMode
    ]);

    useEffect(() => {
        const handler = isFocused && BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                closeImageEditor();
                return true;
            }
        );

        return () => handler && handler.remove();
    }, [
        closeImageEditor,
        isFocused
    ]);

    return (
        <ScreenRoot>
            {isReady && (
                <HeaderBar />
            )}
            <SafeArea>
                <ScreenContent>
                    {isReady ? (
                        <ImageEditorViewContainer>
                            <EditingWindow />
                            {mode === EditorMode.Full && <OperationBar />}
                        </ImageEditorViewContainer>
                    ) : (
                        <Processing isOverlay={false} />
                    )}
                    {isProcessing ? <Processing /> : null}
                </ScreenContent>
            </SafeArea>
        </ScreenRoot>
    );
};

export const ImageEditor = () => {
    const {
        shouldOpen,
        shouldClose,
        navigation
    } = useImageEditorState();
    const resetEditorState = useResetEditorState();

    const previousShouldClose = usePrevious(shouldClose);
    const shouldCloseScreen = shouldClose && !previousShouldClose;
    useEffect(() => {
        if (shouldCloseScreen) {
            navigation.goBack();
            setTimeout(() => resetEditorState(), 1000);
        }
    }, [
        shouldCloseScreen,
        navigation,
        resetEditorState
    ]);

    const previousShouldOpen = usePrevious(shouldOpen);
    const shouldOpenScreen = !shouldClose && shouldOpen && !previousShouldOpen;
    useEffect(() => {
        shouldOpenScreen && navigation.navigate(IMAGE_EDITOR_ROUTE_NAME);
    }, [
        shouldOpenScreen,
        navigation
    ]);

    return null;
};
