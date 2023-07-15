import {
    useEffect,
    useRef,
    useState
} from 'react';
import { manipulateAsync } from 'expo-image-manipulator';
import {
    useAppSnackbarActions,
    APP_SNACKBAR_POSITION,
    APP_SNACKBAR_DURATION
} from '@codexporer.io/expo-app-snackbar';
import {
    useImageData,
    useSetImageData,
    useSetIsProcessing
} from '../../state';

export const RotationDirection = {
    CCW: 'ccw',
    CW: 'cw'
};

export const usePerformRotate = () => {
    const [, { show: showAppSnackbar }] = useAppSnackbarActions();

    const setIsProcessing = useSetIsProcessing();
    const imageData = useImageData();
    const setImageData = useSetImageData();

    const [originalImageData] = useState(imageData);
    const [rotation, setRotation] = useState(0);

    const onRotateRef = useRef();
    onRotateRef.current = async (angle: number) => {
        setIsProcessing(true);

        try {
            // Rotate the image by the specified angle
            // To get rid of thing white line caused by context its being painted onto
            // crop 1 px border off https://github.com/expo/expo/issues/7325
            const {
                uri: rotateUri,
                width: rotateWidth,
                height: rotateHeight
            } = await manipulateAsync(originalImageData.uri, [
                { rotate: angle }
            ]);
            const { uri, width, height } = await manipulateAsync(
                rotateUri,
                [
                    {
                        crop: {
                            originX: 1,
                            originY: 1,
                            width: rotateWidth - 2,
                            height: rotateHeight - 2
                        }
                    }
                ]
            );
            setImageData({ uri, width, height });
        } catch {
            showAppSnackbar({
                message: 'An error occurred while editing.',
                duration: APP_SNACKBAR_DURATION.short,
                position: APP_SNACKBAR_POSITION.bottom
            });
        }

        setIsProcessing(false);
    };

    const originalImageDataRef = useRef();
    originalImageDataRef.current = originalImageData;
    useEffect(() => {
        if (rotation !== 0) {
            onRotateRef.current(rotation);
        } else {
            setImageData(originalImageDataRef.current);
        }
    }, [
        rotation,
        setImageData
    ]);

    return direction => {
        let rotateBy = rotation - 90 * -1 * (direction === RotationDirection.CW ? 1 : -1);
        // keep it in the -180 to 180 range
        if (rotateBy > 180) {
            rotateBy = -90;
        } else if (rotateBy < -180) {
            rotateBy = 90;
        }
        setRotation(rotateBy);
    };
};
