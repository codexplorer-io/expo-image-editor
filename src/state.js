import {
    createStore,
    createStateHook,
    createActionsHook
} from 'react-sweet-state';

export const IMAGE_EDITOR_ROUTE_NAME = 'CodExpoImageEditor';

export const TransformOperation = {
    Crop: 'crop',
    Rotate: 'rotate'
};

export const AdjustmentOperation = {
    Blur: 'blur'
};

export const EditingMode = {
    Select: 'operation-select',
    ...TransformOperation,
    ...AdjustmentOperation
};

export const EditorMode = {
    Full: 'full',
    CropOnly: 'crop-only'
};

const initialState = {
    imageEditorState: {
        shouldOpen: false,
        shouldClose: false,
        navigation: undefined,
        config: {
            mode: EditorMode.Full,
            shouldThrottleBlur: true,
            minimumCropDimensions: { width: 0, height: 0 },
            fixedCropAspectRatio: 1.6,
            isAspectRatioLocked: false,
            allowedTransformOperations: [],
            allowedAdjustmentOperations: [],
            onEditingComplete: undefined,
            imageUri: undefined
        }
    },
    imageData: {
        uri: '',
        width: 0,
        height: 0
    },
    imageScaleFactor: 1,
    imageBounds: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    isReady: false,
    isProcessing: false,
    accumulatedPan: {
        x: 0,
        y: 0
    },
    cropSize: {
        width: 0,
        height: 0
    },
    editingMode: EditingMode.Select,
    glContext: null,
    glProgram: null
};

const initializeNavigation = navigation => ({
    getState,
    setState
}) => {
    setState({
        imageEditorState: {
            ...getState().imageEditorState,
            navigation
        }
    });
};

const openImageEditor = config => ({ setState, getState }) => {
    const { imageEditorState } = getState();
    if (!imageEditorState.shouldOpen) {
        setState({
            imageEditorState: {
                ...imageEditorState,
                shouldOpen: true,
                shouldClose: false,
                config: {
                    ...initialState.imageEditorState.config,
                    ...config
                }
            }
        });
    }
};

const closeImageEditor = () => ({ setState, getState }) => {
    const { imageEditorState } = getState();
    if (!imageEditorState.shouldClose) {
        setState({
            imageEditorState: {
                ...imageEditorState,
                shouldOpen: false,
                shouldClose: true
            }
        });
    }
};

const setImageData = imageData => ({ setState }) => {
    setState({ imageData });
};

const setImageScaleFactor = imageScaleFactor => ({ setState }) => {
    setState({ imageScaleFactor });
};

const setImageBounds = imageBounds => ({ setState }) => {
    setState({ imageBounds });
};

const setIsReady = isReady => ({ setState }) => {
    setState({ isReady });
};

const setIsProcessing = isProcessing => ({ setState }) => {
    setState({ isProcessing });
};

const setAccumulatedPan = accumulatedPan => ({ setState }) => {
    setState({ accumulatedPan });
};

const setCropSize = cropSize => ({ setState }) => {
    setState({ cropSize });
};

const setEditingMode = editingMode => ({ setState }) => {
    setState({ editingMode });
};

const setGlContext = glContext => ({ setState }) => {
    setState({ glContext });
};

const setGlProgram = glProgram => ({ setState }) => {
    setState({ glProgram });
};

const resetEditorState = () => ({ getState, setState }) => {
    setState({
        ...initialState,
        imageEditorState: getState().imageEditorState
    });
};

const Store = createStore({
    initialState,
    actions: {
        initializeNavigation,
        openImageEditor,
        closeImageEditor,
        setImageData,
        setImageScaleFactor,
        setImageBounds,
        setIsReady,
        setIsProcessing,
        setAccumulatedPan,
        setCropSize,
        setEditingMode,
        setGlContext,
        setGlProgram,
        resetEditorState
    },
    name: 'expoImageEditor'
});

const useActions = createActionsHook(Store);

export const useImageEditorState = createStateHook(Store, {
    selector: ({
        imageEditorState: {
            config,
            ...imageEditorState
        }
    }) => imageEditorState
});

export const useImageEditorConfig = createStateHook(Store, {
    selector: ({
        imageEditorState: { config }
    }) => config
});

export const useInitializeNavigation = () => useActions().initializeNavigation;

export const useOpenImageEditor = () => useActions().openImageEditor;

export const useCloseImageEditor = () => useActions().closeImageEditor;

export const useImageData = createStateHook(Store, {
    selector: ({ imageData }) => imageData
});

export const useSetImageData = () => useActions().setImageData;

export const useImageScaleFactor = createStateHook(Store, {
    selector: ({ imageScaleFactor }) => imageScaleFactor
});

export const useSetImageScaleFactor = () => useActions().setImageScaleFactor;

export const useImageBounds = createStateHook(Store, {
    selector: ({ imageBounds }) => imageBounds
});

export const useSetImageBounds = () => useActions().setImageBounds;

export const useIsReady = createStateHook(Store, {
    selector: ({ isReady }) => isReady
});

export const useSetIsReady = () => useActions().setIsReady;

export const useIsProcessing = createStateHook(Store, {
    selector: ({ isProcessing }) => isProcessing
});

export const useSetIsProcessing = () => useActions().setIsProcessing;

export const useAccumulatedPan = createStateHook(Store, {
    selector: ({ accumulatedPan }) => accumulatedPan
});

export const useSetAccumulatedPan = () => useActions().setAccumulatedPan;

export const useCropSize = createStateHook(Store, {
    selector: ({ cropSize }) => cropSize
});

export const useSetCropSize = () => useActions().setCropSize;

export const useEditingMode = createStateHook(Store, {
    selector: ({ editingMode }) => editingMode
});

export const useSetEditingMode = () => useActions().setEditingMode;

export const useGlContext = createStateHook(Store, {
    selector: ({ glContext }) => glContext
});

export const useSetGlContext = () => useActions().setGlContext;

export const useGlProgram = createStateHook(Store, {
    selector: ({ glProgram }) => glProgram
});

export const useSetGlProgram = () => useActions().setGlProgram;

export const useResetEditorState = () => useActions().resetEditorState;
