import React, { useEffect, useRef, useState } from 'react';
import { Image as RNImage } from 'react-native';
import styled from 'styled-components/native';
import { GLView as ExpoGlView } from 'expo-gl';
import { ImageCropOverlay } from './image-crop-overlay';
import {
    EditingMode,
    useEditingMode,
    useImageData,
    useSetGlContext,
    useSetImageBounds,
    useSetImageScaleFactor
} from './state';

const Root = styled.View`
    flex: 1;
`;

const Image = styled(RNImage)`
    flex: 1;
    resize-mode: contain;
`;

const GlContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const GlView = styled(ExpoGlView)`
    width: ${({ width = 1 }) => width}px;
    height: ${({ height = 1 }) => height}px;
    transform: scaleY(-1);
`;

export const EditingWindow = () => {
    const [imageLayout, setImageLayout] = useState(null);

    const imageData = useImageData();
    const setImageBounds = useSetImageBounds();
    const setImageScaleFactor = useSetImageScaleFactor();
    const editingMode = useEditingMode();
    const setGLContext = useSetGlContext();

    // Get some readable boolean states
    const isCropping = editingMode === EditingMode.Crop;
    const isBlurring = editingMode === EditingMode.Blur;
    const usesGL = isBlurring;

    const onUpdateCropLayoutRef = useRef();
    onUpdateCropLayoutRef.current = layout => {
        if (!layout) {
            return;
        }

        // Find the start point of the photo on the screen and its
        // width / height from there
        const editingWindowAspectRatio = layout.height / layout.width;
        //
        const imageAspectRatio = imageData.height / imageData.width;
        const bounds = {
            x: 0, y: 0, width: 0, height: 0
        };
        let imageScaleFactor = 1;
        // Check which is larger
        if (imageAspectRatio > editingWindowAspectRatio) {
            // Then x is non-zero, y is zero; calculate x...
            bounds.x =
                (((imageAspectRatio - editingWindowAspectRatio) / imageAspectRatio) *
                    layout.width) /
                2;
            bounds.width = layout.height / imageAspectRatio;
            bounds.height = layout.height;
            imageScaleFactor = imageData.height / layout.height;
        } else {
            // Then y is non-zero, x is zero; calculate y...
            bounds.y =
                (((1 / imageAspectRatio - 1 / editingWindowAspectRatio) /
                    (1 / imageAspectRatio)) *
                    layout.height) /
                2;
            bounds.width = layout.width;
            bounds.height = layout.width * imageAspectRatio;
            imageScaleFactor = imageData.width / layout.width;
        }

        setImageBounds(bounds);
        setImageScaleFactor(imageScaleFactor);
        setImageLayout({
            height: layout.height,
            width: layout.width
        });
    };

    const getImageFrame = (layout: {
        width: number;
        height: number;
        [key: string]: any;
    }) => {
        onUpdateCropLayoutRef.current(layout);
    };

    const getGLLayout = () => {
        if (!imageLayout) {
            return null;
        }

        const { height: windowHeight, width: windowWidth } = imageLayout;
        const windowAspectRatio = windowWidth / windowHeight;
        const { height: imageHeight, width: imageWidth } = imageData;
        const imageAspectRatio = imageWidth / imageHeight;
        // If the window is taller than img...
        if (windowAspectRatio < imageAspectRatio) {
            return { width: windowWidth, height: windowWidth / imageAspectRatio };
        }

        return { height: windowHeight, width: windowHeight * imageAspectRatio };
    };

    const imageLayoutRef = useRef();
    imageLayoutRef.current = imageLayout;
    useEffect(() => {
        onUpdateCropLayoutRef.current(imageLayoutRef.current);
    }, [imageData]);

    const onGLContextCreate = gl => {
        setGLContext(gl);
    };

    return (
        <Root>
            {usesGL ? (
                <GlContainer>
                    <GlView
                        msaaSamples={0}
                        onContextCreate={onGLContextCreate}
                        {...getGLLayout()}
                    />
                </GlContainer>
            ) : (
                <Image
                    source={{ uri: imageData.uri }}
                    onLayout={({ nativeEvent }) => getImageFrame(nativeEvent.layout)}
                />
            )}
            {isCropping && imageLayout != null ? <ImageCropOverlay /> : null}
        </Root>
    );
};
