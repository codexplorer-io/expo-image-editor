import React, {
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';
import { Animated } from 'react-native';
import {
    GestureHandlerRootView,
    PanGestureHandler,
    State
} from 'react-native-gesture-handler';
import styled from 'styled-components/native';
import endsWith from 'lodash/endsWith';
import startsWith from 'lodash/startsWith';
import map from 'lodash/map';
import includes from 'lodash/includes';
import { EditorContext } from './editor-context';
import {
    useAccumulatedPan,
    useCropSize,
    useImageBounds,
    useSetAccumulatedPan,
    useSetCropSize
} from './state';

const horizontalSections = ['top', 'middle', 'bottom'];
const verticalSections = ['left', 'middle', 'right'];

const Root = styled(GestureHandlerRootView)`
    position: absolute;
    height: 100%;
    width: 100%;
`;

const Overlay = styled(Animated.View)`
    height: 40px;
    width: 40px;
    background-color: ${({ theme }) => theme.colors.backdrop};
    border-color: ${({ theme }) => theme.colors.primary};
    border-width: 1px;
`;

const SectionRow = styled.View`
    flex: 1;
    flex-direction: row;
`;

const DefaultSection = styled.View`
    flex: 1;
    border-width: 0.5px;
    border-color: ${({ theme }) => theme.colors.primary};
    justify-content: center;
    align-items: center;
`;

const CornerMarker = styled.View`
    position: absolute;
    border-color: ${({ theme }) => theme.colors.accent};
    height: 30px;
    width: 30px;
    ${({ hsection, vsection }) => `
        ${hsection === 'top' ? `
            top: -4px;
            border-top-width: 7px;
        ` : `
            bottom: -4px;
            border-bottom-width: 7px;
        `}
        ${vsection === 'left' ? `
            left: -4px;
            border-left-width: 7px;
        ` : `
            right: -4px;
            border-right-width: 7px;
        `}
    `}
`;

export const ImageCropOverlay = () => {
    // Record which section of the fram window has been pressed
    // this determines whether it is a translation or scaling gesture
    const [selectedFrameSection, setSelectedFrameSection] = useState('');

    const cropSize = useCropSize();
    const setCropSize = useSetCropSize();
    const imageBounds = useImageBounds();
    const accumulatedPan = useAccumulatedPan();
    const setAccumluatedPan = useSetAccumulatedPan();
    const {
        fixedAspectRatio,
        isAspectRatioLocked,
        minimumCropDimensions
    } = useContext(EditorContext);

    const [animatedCropSize] = useState({
        width: new Animated.Value(cropSize.width),
        height: new Animated.Value(cropSize.height)
    });

    // pan X and Y values to track the current delta of the pan
    // in both directions - this should be zeroed out on release
    // and the delta added onto the accumulatedPan state
    const panX = useRef(new Animated.Value(imageBounds.x));
    const panY = useRef(new Animated.Value(imageBounds.y));

    const checkCropBoundsRef = useRef();
    checkCropBoundsRef.current = ({
        translationX,
        translationY
    }) => {
        // Check if the pan in the x direction exceeds the bounds
        let accDx = accumulatedPan.x + translationX;
        // Is the new x pos less than zero?
        if (accDx <= imageBounds.x) {
            // Then set it to be zero and set the pan to zero too
            accDx = imageBounds.x;
        } else if (accDx + cropSize.width > imageBounds.width + imageBounds.x) {
            // Is the new x pos plus crop width going to exceed the right hand bound
            // Then set the x pos so the crop frame touches the right hand edge
            const limitedXPos = imageBounds.x + imageBounds.width - cropSize.width;
            accDx = limitedXPos;
        } else {
            // It's somewhere in between - no formatting required
        }
        // Check if the pan in the y direction exceeds the bounds
        let accDy = accumulatedPan.y + translationY;
        // Is the new y pos less the top edge?
        if (accDy <= imageBounds.y) {
            // Then set it to be zero and set the pan to zero too
            accDy = imageBounds.y;
        } else if (accDy + cropSize.height > imageBounds.height + imageBounds.y) {
            // Is the new y pos plus crop height going to exceed the bottom bound
            // Then set the y pos so the crop frame touches the bottom edge
            const limitedYPos = imageBounds.y + imageBounds.height - cropSize.height;
            accDy = limitedYPos;
        } else {
            // It's somewhere in between - no formatting required
        }
        // Record the accumulated pan and reset the pan refs to zero
        panX.current.setValue(0);
        panY.current.setValue(0);
        setAccumluatedPan({ x: accDx, y: accDy });
    };

    useEffect(() => {
        // Move the pan to the origin and check the bounds so it clicks to
        // the corner of the image
        checkCropBoundsRef.current({
            translationX: 0,
            translationY: 0
        });
        // When the crop size updates make sure the animated value does too!
        animatedCropSize.height.setValue(cropSize.height);
        animatedCropSize.width.setValue(cropSize.width);
    }, [
        cropSize,
        animatedCropSize
    ]);

    useEffect(() => {
        // Update the size of the crop window based on the new image bounds
        const newSize = { width: 0, height: 0 };
        const { width, height } = imageBounds;
        const imageAspectRatio = width / height;
        // Then check if the cropping aspect ratio is smaller
        if (fixedAspectRatio < imageAspectRatio) {
            // If so calculate the size so its not greater than the image width
            newSize.height = height;
            newSize.width = height * fixedAspectRatio;
        } else {
            // else, calculate the size so its not greater than the image height
            newSize.width = width;
            newSize.height = width / fixedAspectRatio;
        }
        // Set the size of the crop overlay
        setCropSize(newSize);
    }, [
        imageBounds,
        fixedAspectRatio,
        setCropSize
    ]);

    // Function that sets which sections allow for translation when
    // pressed
    const isMovingSection = () => includes(
        ['topmiddle', 'middleleft', 'middleright', 'middlemiddle', 'bottommiddle'],
        selectedFrameSection
    );

    // Check what resizing / translation needs to be performed based on which section was pressed
    const isLeft = endsWith(selectedFrameSection, 'left');
    const isTop = startsWith(selectedFrameSection, 'top');

    const getTargetCropFrameBounds = ({ translationX, translationY }) => {
        let x = 0;
        let y = 0;

        if (!translationX || !translationY) {
            return { x, y };
        }

        if (translationX < translationY) {
            x = (isLeft ? -1 : 1) * translationX;

            if (isAspectRatioLocked) {
                y = x / fixedAspectRatio;
            } else {
                y = (isTop ? -1 : 1) * translationY;
            }

            return { x, y };
        }

        y = (isTop ? -1 : 1) * translationY;

        if (isAspectRatioLocked) {
            x = y * fixedAspectRatio;
        } else {
            x = (isLeft ? -1 : 1) * translationX;
        }

        return { x, y };
    };

    const onOverlayMove = ({ nativeEvent }) => {
        if (selectedFrameSection !== '') {
            // Check if the section pressed is one to translate the crop window or not
            if (isMovingSection()) {
                // If it is then use an animated event to directly pass the tranlation
                // to the pan refs
                Animated.event(
                    [
                        {
                            translationX: panX.current,
                            translationY: panY.current
                        }
                    ],
                    { useNativeDriver: false }
                )(nativeEvent);
                return;
            }

            // Else its a scaling operation
            const { x, y } = getTargetCropFrameBounds(nativeEvent);
            if (isTop) {
                panY.current.setValue(-y);
            }
            if (isLeft) {
                panX.current.setValue(-x);
            }
            // Finally update the animated width to the values the crop
            // window has been resized to
            animatedCropSize.width.setValue(cropSize.width + x);
            animatedCropSize.height.setValue(cropSize.height + y);
            return;
        }

        // We need to set which section has been pressed
        const { x, y } = nativeEvent;
        const { width: initialWidth, height: initialHeight } = cropSize;
        let position = '';
        // Figure out where we pressed vertically
        if (y / initialHeight < 0.333) {
            position += 'top';
        } else if (y / initialHeight < 0.667) {
            position += 'middle';
        } else {
            position += 'bottom';
        }
        // Figure out where we pressed horizontally
        if (x / initialWidth < 0.333) {
            position += 'left';
        } else if (x / initialWidth < 0.667) {
            position += 'middle';
        } else {
            position += 'right';
        }

        setSelectedFrameSection(position);
    };

    const checkResizeBounds = ({ translationX, translationY }) => {
        // Check we haven't gone out of bounds when resizing - allow it to be
        // resized up to the appropriate bounds if so
        const { width: maxWidth, height: maxHeight } = imageBounds;
        const { width: minWidth, height: minHeight } = minimumCropDimensions;
        const { x, y } = getTargetCropFrameBounds({ translationX, translationY });
        const animatedWidth = cropSize.width + x;
        const animatedHeight = cropSize.height + y;
        let finalHeight = animatedHeight;
        let finalWidth = animatedWidth;
        // Ensure the width / height does not exceed the boundaries -
        // resize to the max it can be if so
        if (animatedHeight > maxHeight) {
            finalHeight = maxHeight;
            if (isAspectRatioLocked) {
                finalWidth = finalHeight * fixedAspectRatio;
            }
        } else if (animatedHeight < minHeight) {
            finalHeight = minHeight;
            if (isAspectRatioLocked) {
                finalWidth = finalHeight * fixedAspectRatio;
            }
        }
        if (animatedWidth > maxWidth) {
            finalWidth = maxWidth;
            if (isAspectRatioLocked) {
                finalHeight = finalWidth / fixedAspectRatio;
            }
        } else if (animatedWidth < minWidth) {
            finalWidth = minWidth;
            if (isAspectRatioLocked) {
                finalHeight = finalWidth / fixedAspectRatio;
            }
        }
        // Update the accumulated pan with the delta from the pan refs
        setAccumluatedPan({
            x: accumulatedPan.x + (isLeft ? -x : 0),
            y: accumulatedPan.y + (isTop ? -y : 0)
        });
        // Zero out the pan refs
        panX.current.setValue(0);
        panY.current.setValue(0);
        // Update the crop size to the size after resizing
        setCropSize({
            height: finalHeight,
            width: finalWidth
        });
    };

    const onOverlayRelease = nativeEvent => {
        // Check if the section pressed is one to translate the crop window or not
        if (isMovingSection()) {
            // Ensure the cropping overlay has not been moved outside of the allowed bounds
            checkCropBoundsRef.current(nativeEvent);
        } else {
            // Else its a scaling op - check that the resizing didnt take it out of bounds
            checkResizeBounds(nativeEvent);
        }
        // Disable the pan responder so the section tiles can register being pressed again
        setSelectedFrameSection('');
    };

    const onHandlerStateChange = ({ nativeEvent }) => {
        // Handle any state changes from the pan gesture handler
        // only looking at when the touch ends atm
        if (nativeEvent.state === State.END) {
            onOverlayRelease(nativeEvent);
        }
    };

    return (
        <Root>
            <PanGestureHandler
                onGestureEvent={onOverlayMove}
                onHandlerStateChange={e => onHandlerStateChange(e)}
            >
                <Overlay
                    // eslint-disable-next-line react/forbid-component-props
                    style={[
                        animatedCropSize,
                        {
                            transform: [
                                { translateX: Animated.add(panX.current, accumulatedPan.x) },
                                { translateY: Animated.add(panY.current, accumulatedPan.y) }
                            ]
                        }
                    ]}
                >
                    {
                        // For reendering out each section of the crop overlay frame
                        map(horizontalSections, hsection => (
                            <SectionRow key={hsection}>
                                {map(verticalSections, vsection => {
                                    const key = hsection + vsection;
                                    return (
                                        <DefaultSection key={key}>
                                            {
                                                // Add the corner markers to the topleft,
                                                // topright, bottomleft and bottomright corners to indicate resizing
                                                includes(['topleft', 'topright', 'bottomleft', 'bottomright'], key) ? (
                                                    <CornerMarker
                                                        hsection={hsection}
                                                        vsection={vsection}
                                                    />
                                                ) : null
                                            }
                                        </DefaultSection>
                                    );
                                })}
                            </SectionRow>
                        ))
                    }
                </Overlay>
            </PanGestureHandler>
        </Root>
    );
};
