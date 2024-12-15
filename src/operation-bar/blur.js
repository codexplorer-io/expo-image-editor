import React, {
    useEffect,
    useRef,
    useState
} from 'react';
import styled from 'styled-components/native';
import { GLView } from 'expo-gl';
import { manipulateAsync, FlipType } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import throttle from 'lodash/throttle';
import { IconButton } from '../icon-button';
import {
    EditingMode,
    useGlContext,
    useImageBounds,
    useImageData,
    useImageEditorConfigShouldThrottleBlur,
    useSetEditingMode,
    useSetGlContext,
    useSetImageData,
    useSetIsProcessing
} from '../state';
import {
    PromptLabel,
    OperationsRow
} from './styled';

const vertShader = `
precision highp float;
attribute vec2 position;
varying vec2 uv;
void main () {
  uv = position;
  gl_Position = vec4(1.0 - 2.0 * uv, 0, 1);
}`;

const fragShader = `
precision highp float;
precision highp int;
uniform sampler2D texture;
uniform highp float width;
uniform highp float height;
varying vec2 uv;
uniform highp int radius;
uniform highp int pass;
uniform highp float pixelFrequency;
float gauss (float sigma, float x) {
  float g = (1.0/sqrt(2.0*3.142*sigma*sigma))*exp(-0.5*(x*x)/(sigma*sigma));
  return g;
}
void main () {
  float f_radius = float(radius);
  float sigma = (0.5 * f_radius);
  // Get the color of the fragment pixel
  vec4 color = texture2D(texture, vec2(uv.x, uv.y));
  color *= gauss(sigma, 0.0);
  // Loop over the neightbouring pixels
  for (int i = -30; i <= 30; i++) {
    // Make sure we don't include the main pixel which we already sampled!
    if (i != 0) {
      // Check we are on an index that doesn't exceed the blur radius specified
      if (i >= -radius && i <= radius) {
        float index = float(i);
        // Caclulate the current pixel index
        float pixelIndex = 0.0;
        if (pass == 0) {
          pixelIndex = (uv.y) * height;
        }
        else {
          pixelIndex = uv.x * width;
        }
        // Get the neighbouring pixel index
        float offset = index * pixelFrequency;
        pixelIndex += offset;
        // Normalise the new index back into the 0.0 to 1.0 range
        if (pass == 0) {
          pixelIndex /= height;
        }
        else {
          pixelIndex /= width;
        }
        // Pad the UV 
        if (pixelIndex < 0.0) {
          pixelIndex = 0.0;
        }
        if (pixelIndex > 1.0) {
          pixelIndex = 1.0;
        }
        // Get gaussian amplitude
        float g = gauss(sigma, index);
        // Get the color of neighbouring pixel
        vec4 previousColor = vec4(0.0, 0.0, 0.0, 0.0);
        if (pass == 0) {
          previousColor = texture2D(texture, vec2(uv.x, pixelIndex)) * g;
        }
        else {
          previousColor = texture2D(texture, vec2(pixelIndex, uv.y)) * g;
        }
        color += previousColor;
      }
    }
  }
  // Return the resulting color
  gl_FragColor = color;
}`;

const Root = styled.View`
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
`;

const SliderRow = styled.View`
    width: 100%;
    height: 80px;
    flex-direction: row;
    justify-content: space-between;
    alignItems: center;
    paddingHorizontal: 2%;
    justify-content: center;
`;

export const Blur = () => {
    const setIsProcessing = useSetIsProcessing();
    const imageData = useImageData();
    const setImageData = useSetImageData();
    const setEditingMode = useSetEditingMode();
    const glContext = useGlContext();
    const setGLContext = useSetGlContext();
    const imageBounds = useImageBounds();

    const shouldThrottleBlur = useImageEditorConfigShouldThrottleBlur();

    const [sliderValue, setSliderValue] = useState(15);
    const [blur, setBlur] = useState(15);
    const [glProgram, setGLProgram] = React.useState(null);

    const onClose = () => {
        // If closing reset the image back to its original
        setGLContext(null);
        setEditingMode(EditingMode.Select);
    };

    const onSaveWithBlur = async () => {
        if (!glContext) {
            return;
        }

        // Set the processing to true so no UI can be interacted with
        setIsProcessing(true);
        // Take a snapshot of the GLView's current framebuffer and set that as the new image data
        glContext.drawArrays(glContext.TRIANGLES, 0, 6);
        const output = await GLView.takeSnapshotAsync(glContext);
        // Do any addtional platform processing of the result and set it as the new image data
        const flippedOutput = await manipulateAsync(
            output.uri,
            [{ flip: FlipType.Vertical }]
        );
        setImageData({
            uri: flippedOutput.uri,
            width: flippedOutput.width,
            height: flippedOutput.height
        });

        // Reset back to operation selection mode
        setIsProcessing(false);
        setGLContext(null);
        // Small timeout so it can set processing state to flase BEFORE
        // Blur component is unmounted...
        setTimeout(() => {
            setEditingMode(EditingMode.Select);
        }, 100);
    };

    const imageBoundsRef = useRef();
    imageBoundsRef.current = imageBounds;
    useEffect(() => {
        if (glContext === null) {
            return;
        }

        const setupGL = async () => {
            // Load in the asset and get its height and width
            // Do some magic instead of using asset.download async as this tries to
            // redownload the file:// uri on android and iOS
            const asset = {
                uri: imageData.uri,
                localUri: imageData.uri,
                height: imageData.height,
                width: imageData.width
            };
            await FileSystem.copyAsync({
                from: asset.uri,
                to: `${FileSystem.cacheDirectory}blur.jpg`
            });
            asset.localUri = `${FileSystem.cacheDirectory}blur.jpg`;

            if (!asset.width || !asset.height) {
                return;
            }

            // Setup the shaders for our GL context so it draws from texImage2D
            const vert = glContext.createShader(glContext.VERTEX_SHADER);
            const frag = glContext.createShader(glContext.FRAGMENT_SHADER);
            if (!vert || !frag) {
                return;
            }

            // Set the source of the shaders and compile them
            glContext.shaderSource(vert, vertShader);
            glContext.compileShader(vert);
            glContext.shaderSource(frag, fragShader);
            glContext.compileShader(frag);
            // Create a WebGL program so we can link the shaders together
            const program = glContext.createProgram();
            if (!program) {
                return;
            }

            // Attach both the vertex and frag shader to the program
            glContext.attachShader(program, vert);
            glContext.attachShader(program, frag);
            // Link the program - ensures that vetex and frag shaders are compatible
            // with each other
            glContext.linkProgram(program);
            // Tell GL we ant to now use this program
            glContext.useProgram(program);
            // Create a buffer on the GPU and assign its type as array buffer
            const buffer = glContext.createBuffer();
            glContext.bindBuffer(glContext.ARRAY_BUFFER, buffer);
            // Create the verticies for WebGL to form triangles on the screen
            // using the vertex shader which forms a square or rectangle in this case
            const verts = new Float32Array([
                -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, 1
            ]);
            // Actually pass the verticies into the buffer and tell WebGL this is static
            // for optimisations
            glContext.bufferData(glContext.ARRAY_BUFFER, verts, glContext.STATIC_DRAW);
            // Get the index in memory for the position attribute defined in the
            // vertex shader
            const positionAttrib = glContext.getAttribLocation(program, 'position');
            glContext.enableVertexAttribArray(positionAttrib); // Enable it i guess
            // Tell the vertex shader how to process this attribute buffer
            glContext.vertexAttribPointer(
                positionAttrib,
                2,
                glContext.FLOAT,
                false,
                0,
                0
            );
            // Fetch an expo asset which can passed in as the source for the
            // texImage2D

            // Create some space in memory for a texture
            const texture = glContext.createTexture();
            // Set the active texture to the texture 0 binding (0-30)
            glContext.activeTexture(glContext.TEXTURE0);
            // Bind the texture to WebGL stating what type of texture it is
            glContext.bindTexture(glContext.TEXTURE_2D, texture);
            // Set some parameters for the texture
            glContext.texParameteri(
                glContext.TEXTURE_2D,
                glContext.TEXTURE_MAG_FILTER,
                glContext.LINEAR
            );
            glContext.texParameteri(
                glContext.TEXTURE_2D,
                glContext.TEXTURE_MIN_FILTER,
                glContext.LINEAR
            );
            // Then set the data of this texture using texImage2D
            glContext.texImage2D(
                glContext.TEXTURE_2D,
                0,
                glContext.RGBA,
                glContext.RGBA,
                glContext.UNSIGNED_BYTE,
                asset
            );
            // Set a bunch of uniforms we want to pass into our fragment shader
            glContext.uniform1i(glContext.getUniformLocation(program, 'texture'), 0);
            glContext.uniform1f(
                glContext.getUniformLocation(program, 'width'),
                asset.width
            );
            glContext.uniform1f(
                glContext.getUniformLocation(program, 'height'),
                asset.height
            );
            // Calculate the pixel frequency to sample at based on the image resolution
            // as the blur radius is in dp
            const pixelFrequency = Math.max(
                Math.round(imageData.width / imageBoundsRef.current.width / 2),
                1
            );
            glContext.uniform1f(
                glContext.getUniformLocation(program, 'pixelFrequency'),
                pixelFrequency
            );
            setGLProgram(program);
        };

        setupGL().catch(e => {
            // eslint-disable-next-line no-console
            console.log('GL setup failed');
            // eslint-disable-next-line no-console
            console.error(e);
        });
    }, [glContext, imageData]);

    useEffect(() => {
        if (!glContext || !glProgram) {
            return;
        }

        glContext.uniform1i(glContext.getUniformLocation(glProgram, 'texture'), 0);
        glContext.uniform1i(glContext.getUniformLocation(glProgram, 'radius'), blur);
        glContext.uniform1i(glContext.getUniformLocation(glProgram, 'pass'), 0);
        // Setup so first pass renders to a texture rather than to canvas
        // Create and bind the framebuffer
        const firstPassTexture = glContext.createTexture();
        // Set the active texture to the texture 0 binding (0-30)
        glContext.activeTexture(glContext.TEXTURE1);
        // Bind the texture to WebGL stating what type of texture it is
        glContext.bindTexture(glContext.TEXTURE_2D, firstPassTexture);
        // Set some parameters for the texture
        glContext.texParameteri(
            glContext.TEXTURE_2D,
            glContext.TEXTURE_MAG_FILTER,
            glContext.LINEAR
        );
        glContext.texParameteri(
            glContext.TEXTURE_2D,
            glContext.TEXTURE_MIN_FILTER,
            glContext.LINEAR
        );
        // Then set the data of this texture using texImage2D
        glContext.texImage2D(
            glContext.TEXTURE_2D,
            0,
            glContext.RGBA,
            glContext.drawingBufferWidth,
            glContext.drawingBufferHeight,
            0,
            glContext.RGBA,
            glContext.UNSIGNED_BYTE,
            null
        );
        const fb = glContext.createFramebuffer();
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, fb);
        // attach the texture as the first color attachment
        const attachmentPoint = glContext.COLOR_ATTACHMENT0;
        glContext.framebufferTexture2D(
            glContext.FRAMEBUFFER,
            attachmentPoint,
            glContext.TEXTURE_2D,
            firstPassTexture,
            0
        );
        // glContext.viewport(0, 0, imageData.width, imageData.height);
        // Actually draw using the shader program we setup!
        glContext.drawArrays(glContext.TRIANGLES, 0, 6);
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, null);
        // glContext.viewport(0, 0, imageData.width, imageData.height);
        glContext.uniform1i(glContext.getUniformLocation(glProgram, 'texture'), 1);
        glContext.uniform1i(glContext.getUniformLocation(glProgram, 'pass'), 1);
        glContext.drawArrays(glContext.TRIANGLES, 0, 6);
        glContext.endFrameEXP();
    }, [blur, glContext, glProgram]);

    const throttleSliderBlur = React.useRef(
        throttle(value => setBlur(value), 50, { leading: true })
    ).current;

    // eslint-disable-next-line no-unused-vars
    const handleSliderValueChange = value => {
        setSliderValue(value[0]);
        if (shouldThrottleBlur) {
            throttleSliderBlur(Math.round(value[0]));
        } else {
            setBlur(Math.round(value[0]));
        }
    };

    return glContext ? (
        <Root>
            <SliderRow>
                {/* TODO Implement slider when needed
                    <Slider
                        value={sliderValue}
                        onValueChange={handleSliderValueChange}
                        minimumValue={1}
                        maximumValue={30}
                        minimumTrackTintColor='#00A3FF'
                        maximumTrackTintColor='#ccc'
                        thumbTintColor='#c4c4c4'
                        containerStyle={{
                            height: 20,
                            width: '90%',
                            maxWidth: 600
                        }}
                        trackStyle={{
                            borderRadius: 10
                        }}
                    />
                */}
            </SliderRow>
            <OperationsRow>
                <IconButton iconName='close' text='Cancel' onPress={() => onClose()} />
                <PromptLabel>
                    Blur Radius:
                    {' '}
                    {Math.round(sliderValue)}
                </PromptLabel>
                <IconButton
                    iconName='check'
                    text='Done'
                    onPress={() => onSaveWithBlur()}
                />
            </OperationsRow>
        </Root>
    ) : null;
};
