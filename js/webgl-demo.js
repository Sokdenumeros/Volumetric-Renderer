import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { initializeColorMap, tF} from "./transfer-function.js";
import { loadModel } from "./load-model.js";
import camera from './camera.js';


//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}


//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram,
      )}`,
    );
    return null;
  }

  return shaderProgram;
}

// Create a function to load a shader source file and return a Promise
function loadShaderFile(gl, type, filename) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", filename, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const source = xhr.responseText;
                    const shader = loadShader(gl, type, source);
                    resolve(shader);
                } else {
                    reject(new Error(`Failed to load shader file: ${filename}`));
                }
            }
        };
        xhr.send();
    });
}

// Asynchronous function to load and initialize shader program
async function initShaderProgramFromFiles(gl, vertexShaderFile, fragmentShaderFile) {
    try {
        const [vertexShader, fragmentShader] = await Promise.all([
            loadShaderFile(gl, gl.VERTEX_SHADER, vertexShaderFile),
            loadShaderFile(gl, gl.FRAGMENT_SHADER, fragmentShaderFile)
        ]);

        // Create the shader program
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
            return null;
        }

        return shaderProgram;
    } catch (error) {
        console.error(error);
        return null;
    }
}

main();
//
// start here
//
function main() {  
  const canvas = document.querySelector("#glcanvas");
  const fps = document.getElementById("fps");
  // Initialize the GL context
  const gl = canvas.getContext("webgl2");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL2. Your browser or machine may not support it.",
    );
    return;
  }

  //create texture
  // Load texture
  let texture = gl.createTexture();
  //loadTexture(gl, texture, 6, 5, 4);

  //configure the load button
  var loadButton = document.getElementById('load-button');
  //Add the listeners
  if (loadButton) {
    loadButton.addEventListener('click', () => {
      loadModel(gl, texture);
    });
  } else {
    console.error('Button not found.');
  }
  let currentStrategy = 0;
  var radioButtons = document.getElementsByName('options');
  radioButtons.forEach(function(radioButton){
    radioButton.addEventListener('change', function() {
      currentStrategy = this.value;
    })
  });

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  //CAMERA
  const initialCameraPosition = [0, 0, 5];
  const initialCameraTarget = [0, 0, 0];
  const initialCameraUp = [0, 1, 0];
  camera.init(canvas, initialCameraPosition, initialCameraTarget, initialCameraUp);

  //SHADERS
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  //const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const vertexShaderFile = "../shaders/vertexShader.glsl";
  const fragnentShaderFile = "../shaders/fragmentShader.glsl";
  const shaderProgram = initShaderProgramFromFiles(gl, vertexShaderFile, fragnentShaderFile).then((shaderProgram) => {
  if (shaderProgram) {
    // Shader program is ready, you can use it for rendering.
    const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
      uVolume: gl.getUniformLocation(shaderProgram, "uVolume"),
      dimensions: gl.getUniformLocation(shaderProgram, "uDimensions"),
      tF:gl.getUniformLocation(shaderProgram, "uTF"),
      tFOpacity: gl.getUniformLocation(shaderProgram, "uTFOpacity"),
      tFColor: gl.getUniformLocation(shaderProgram, "uTFColor"),
      lightLambda: gl.getUniformLocation(shaderProgram, "uLightLambda"),
      lightPhi: gl.getUniformLocation(shaderProgram, "uLightPhi"),
      lightRadius: gl.getUniformLocation(shaderProgram, "uLightRadius"),
      lightDistance: gl.getUniformLocation(shaderProgram, "uLightDistance"),
      lightNRays: gl.getUniformLocation(shaderProgram, "uLightNRays"),
      strategy: gl.getUniformLocation(shaderProgram, "uStrategy"),
    },
  };


  //TRANSFER FUNCTION
  //initializeColorMap(0, 255);

  //FPS
  let startTime = Date.now();
  let fpsArray = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

  //RENDER ROUTINE
  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  
  //// Flip image pixels into the bottom-to-top order that WebGL expects.
  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  
  let then = 0;
  // Draw the scene repeatedly
  function render(now) {
    //PRE-FRAME
    const light = {
      lambda: document.getElementById('light-lambda-value').value,
      phi: document.getElementById('light-phi-value').value,
      radius: document.getElementById('light-radius-value').value,
      distance: document.getElementById('light-distance-value').value,
      nRays: document.getElementById('light-nRays-value').value,
      strategy: currentStrategy
    }

    //RENDER
    let dimensions = [1,1,1];
    if(document.getElementById('dimX') != null)
    {
      dimensions = [parseInt(document.getElementById('dimX').textContent), 
                    parseInt(document.getElementById('dimY').textContent), 
                    parseInt(document.getElementById('dimZ').textContent)];
      //console.log(dimensions);
    }
    drawScene(gl, programInfo, buffers, texture, camera, tF, light, dimensions);
  
    //POST-FRAME
    //Frame rate
    const currentTime = Date.now();
    const elapsedMilliseconds = currentTime - startTime;
    const currentFramerate = Math.round((1. / elapsedMilliseconds) * 1000);
    //Compute the average of last n-fps
    fpsArray.push(currentFramerate);
    fpsArray.shift();
    let sum = 0;
    fpsArray.forEach(function(item, index) { sum += item;});
    const fpsAvg = sum/fpsArray.length;
    // Display the framerate on the canvas
    if(currentFramerate < 3)
      fps.textContent = "FPS: " + currentFramerate;
    else
      fps.textContent = "FPS: " + Math.round(fpsAvg);
    startTime = Date.now();


    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);




    }
  });

}
