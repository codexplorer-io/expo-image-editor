import { TransitionPresets } from '@react-navigation/stack';
import { ImageEditorScreen } from './image-editor-screen';
import { IMAGE_EDITOR_ROUTE_NAME } from './state';

export {
    EditorMode,
    TransformOperation,
    AdjustmentOperation,
    useInitializeNavigation,
    useOpenImageEditor,
    useCloseImageEditor
} from './state';

export { ImageEditor } from './image-editor-screen';

export const getRouteConfig = () => [
    {
        name: IMAGE_EDITOR_ROUTE_NAME,
        screen: ImageEditorScreen,
        screenOptions: {
            ...TransitionPresets.ModalSlideFromBottomIOS
        }
    }
];
