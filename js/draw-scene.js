// Tell WebGL how to pull out the normals from
// the normal buffer into the vertexNormal attribute.
function setNormalAttribute(gl, buffers, programInfo) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexNormal,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}


// tell webgl how to pull out the texture coordinates from buffer
function setTextureAttribute(gl, buffers, programInfo) {
  const num = 3; // every coordinate composed of 2 values
  const type = gl.FLOAT; // the data in the buffer is 32-bit float
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set to the next
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
  gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord,
    num,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}


// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl, buffers, programInfo) {
  //const numComponents = 2; // pull out 2 values per iteration
  const numComponents = 3;
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

}

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(gl, buffers, programInfo) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

function drawScene(gl, programInfo, buffers, texture, camera, tF, light, dimensions) {


  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //set modelview, projection and normal matrices
  const projectionMatrix = camera.projectionMatrix;
  const modelViewMatrix = camera.viewMatrix;
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  setPositionAttribute(gl, buffers, programInfo);
  setTextureAttribute(gl, buffers, programInfo);
  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  //matrices
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix, );
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix, );
  gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix, );
  //transferFunction
  gl.uniform4f(programInfo.uniformLocations.tF, tF.x0, tF.x1, tF.x2, tF.x3);
  gl.uniform1f(programInfo.uniformLocations.tFOpacity, tF.opacity);
  gl.uniform3f(programInfo.uniformLocations.tFColor, tF.color[0], tF.color[1], tF.color[2]);
  //light
  gl.uniform1f(programInfo.uniformLocations.lightLambda, light.lambda);
  gl.uniform1f(programInfo.uniformLocations.lightPhi, light.phi);
  gl.uniform1f(programInfo.uniformLocations.lightRadius, light.radius);
  gl.uniform1f(programInfo.uniformLocations.lightDistance, light.distance);
  gl.uniform1i(programInfo.uniformLocations.lightNRays, light.nRays);
  gl.uniform1i(programInfo.uniformLocations.strategy, light.strategy);

  //Textures
  if(texture != null) {
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_3D, texture);
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uVolume, 0);
    //Tell the shader the dimensions
    gl.uniform3f(programInfo.uniformLocations.dimensions, dimensions[0], dimensions[1], dimensions[2]);
  }

  {
  const vertexCount = 36;
  const type = gl.UNSIGNED_SHORT;
  const offset = 0;
  gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
  

}

export { drawScene };
