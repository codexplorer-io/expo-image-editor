import { manipulateAsync } from 'expo-image-manipulator';
import {
    useAppSnackbarActions,
    APP_SNACKBAR_POSITION,
    APP_SNACKBAR_DURATION
} from '@codexporer.io/expo-app-snackbar';
import {
    useAccumulatedPan,
    useCropSize,
    useSetEditingMode,
    useImageBounds,
    useImageData,
    useSetImageData,
    useImageScaleFactor,
    useSetIsProcessing,
    EditingMode
} from '../../state';

export const usePerformCrop = () => {
    const [, { show: showAppSnackbar }] = useAppSnackbarActions();

    const accumulatedPan = useAccumulatedPan();
    const imageBounds = useImageBounds();
    const imageScaleFactor = useImageScaleFactor();
    const cropSize = useCropSize();
    const setIsProcessing = useSetIsProcessing();
    const imageData = useImageData();
    const setImageData = useSetImageData();
    const setEditingMode = useSetEditingMode();

    return async () => {
        // Set the editor state to processing and perform the crop
        setIsProcessing(true);

        try {
            // Calculate cropping bounds
            const croppingBounds = {
                originX: Math.round(
                    (accumulatedPan.x - imageBounds.x) * imageScaleFactor
                ),
                originY: Math.round(
                    (accumulatedPan.y - imageBounds.y) * imageScaleFactor
                ),
                width: Math.round(cropSize.width * imageScaleFactor),
                height: Math.round(cropSize.height * imageScaleFactor)
            };
            const cropResult = await manipulateAsync(imageData.uri, [
                { crop: croppingBounds }
            ]);
            const { uri, width, height } = cropResult;
            setImageData({ uri, width, height });
            setEditingMode(EditingMode.Select);
        } catch (error) {
            showAppSnackbar({
                message: 'An error occurred while editing.',
                duration: APP_SNACKBAR_DURATION.short,
                position: APP_SNACKBAR_POSITION.bottom
            });
        }

        setIsProcessing(false);
    };
};
