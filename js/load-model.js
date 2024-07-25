import { initializeColorMap, tF} from "./transfer-function.js";

function findMinMax(arr) {
  if (!arr || arr.length === 0) {
    // Handle empty or undefined array
    return null;
  }

  let min = arr[0];
  let max = arr[0];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      min = arr[i];
    } else if (arr[i] > max) {
      max = arr[i];
    }
  }

  return { min, max };
}

//function to send the volume texture to the gpu
function loadTexture(gl, texture, modelData){
  
	var volDims = [parseInt(modelData.width), parseInt(modelData.height), parseInt(modelData.depth)];

  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_3D, texture);

  const levels = 1;
  const internalFormat = gl.R16F;//R32F;
  const width = volDims[0];//inverted z and x to to adapt to the raw file structure
  const height = volDims[1];
  const depth = volDims[2];
  gl.texStorage3D(gl.TEXTURE_3D, levels, internalFormat, width, height, depth);
  
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  
  const level = 0;
  const xOffset = 0;
  const yOffset = 0;
  const zOffset = 0;
  const border = 0;
  const srcFormat = gl.RED;
  const srcType = gl.FLOAT;
  //const voxels = new Float32Array([
  //  0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8, 2.85, 2.9 ,2.95, 3, 3.05, 3.1, 3.15, 3.2, 3.25, 3.3, 3.35, 3.4, 3.45, 3.5, 3.55, 3.6, 3.65, 3.7, 3.75, 3.8, 3.85, 3.9, 3.95, 4, 4.05, 4.1, 4.15, 4.2, 4.25, 4.3, 4.35, 4.4, 4.45, 4.5, 4.55, 4.6, 4.65, 4.7, 4.75, 4.8, 4.85, 4.9, 4.95, 5, 5.05, 5.1, 5.15, 5.2, 5.25, 5.3, 5.35, 5.4, 5.45, 5.5, 5.55, 5.6, 5.65, 5.7, 5.75, 5.8, 5.85, 5.9, 5.95
  //]);
  const voxels = new Float32Array(modelData.data);
  //console.log(voxels);

  gl.texSubImage3D(gl.TEXTURE_3D, level, xOffset, yOffset, zOffset,
                    width, height, depth, srcFormat, srcType, voxels);

  gl.bindTexture(gl.TEXTURE_3D, null);
  
  return texture;
}

function parseFilename(filename) {
  // Split the filename based on "-"
  const parts = filename.split('_');

  if (parts.length === 4) {
    const name = parts[0];
    const x = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const z = parseInt(parts[3], 10);

    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      return {
        name: name,
        x: x,
        y: y,
        z: z
      };
    }
  }

  // Return null if the filename doesn't match the expected format
  return null;
}

function readModelAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      const dataBuffer = content.split(/\s+/).filter(Boolean).map(parseFloat);

      // Check for NaN values in the parsed array
      //if (dataBuffer.some(isNaN)) {
        //reject(new Error('Invalid numeric values in the file.'));
      //  console.log("Inside NaN detected!");
      //} else {
        resolve(dataBuffer);
      //}
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file);
  });
}

function readBinModelAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Create a DataView to interpret the binary data
        const dataView = new DataView(arrayBuffer);

        // Determine the number of floats based on the size of a float (4 bytes)
        const numFloats = arrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT;

        // Initialize an array to store the float values
        const floatArray = new Float32Array(numFloats);

        // Iterate over the binary data and read each float value
        for (let i = 0; i < numFloats; i++) {
            floatArray[i] = dataView.getFloat32(i * Float32Array.BYTES_PER_ELEMENT, true);
            // true for little-endian, adjust if needed
        }

        resolve(floatArray);
    };

    reader.onerror = function (event) {
        reject(new Error('Error reading the binary file.'));
    };

    // Read the binary data from the file asynchronously
    reader.readAsArrayBuffer(file);
});
}

async function loadModel(gl, texture, min, max) {
  const fileInput = document.getElementById("modelFileInput");
  const fileInfoContainer = document.getElementById("modelInfo");

  const file = fileInput.files[0];
  if(file) {
    const fileInfo = parseFilename(file.name);

    if (fileInfo) {
      try {
        // Wait for the file to be fully read before continuing
        //await Promise.all([readModelAsync(file)]);
        let dataBuffer = await readModelAsync(file);
        if(dataBuffer.some(element => isNaN(element))) {
          //console.log("NaN detected!");
          dataBuffer = await readBinModelAsync(file);
        }
          
        const modelData = {
          name: fileInfo.name,
          width: parseInt(fileInfo.z),
          height: parseInt(fileInfo.y),
          depth: parseInt(fileInfo.x),
          data: dataBuffer
        };
        // Display model information
        fileInfoContainer.innerHTML = `
          <p>Model Name: ${modelData.name}</p>
          <p>Dimensions: <span id="dimX">${modelData.width}</span> x <span id="dimY">${modelData.height}</span> x <span id="dimZ">${modelData.depth}</span></p>
          <!-- Add more information as needed -->
        `;
        // Placeholder function for using the model data in WebGL viewer
        loadTexture(gl, texture, modelData);

        //compute min a max value
        const minmax = findMinMax(dataBuffer);
        initializeColorMap(minmax.min, minmax.max);

      } catch (error) {
        console.error("Error reading file:", error);
        fileInfoContainer.innerHTML = '<p>ERROR LOADING!</p>';
      }
      
      
    } else {
      fileInfoContainer.innerHTML = "No valid file name selected.";
    }
  } else {
    fileInfoContainer.innerHTML = "No valid file selected.";
  }
}

  export { loadModel };