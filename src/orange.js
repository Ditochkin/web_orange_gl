let gl = null;

function initWebGl(canvas) {
    gl = canvas.getContext("webgl");

    if (!gl) {
        console.log("WebGL not supported")
        gl = canvas.getContext("experimental-webgl");
    }

    if (!gl) {
        alert("Your browser does not support WebGL");
    }

    gl.clearColor(1.0, 1.0, 1.0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function loadShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Error! Shader compile status ", gl.getShaderInfoLog(shader));
        return;
    }
    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Error! Link program", gl.getProgramInfoLog(shaderProgram));
        return;
    }

    gl.validateProgram(shaderProgram)
    if (!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS)) {
        console.error("Error! validate program", gl.getProgramInfoLog(shaderProgram));
        return;
    }

    return shaderProgram;
}

function radian(deg) {
    return deg * Math.PI / 180;
}

function processTexture(img, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

function getTexture(img) {
    let texture = gl.createTexture();
    let image = new Image();
    
    image.onload = function () {
        processTexture(image, texture);
    }

    image.src = img;
    return texture
}

function parseObjFile(fileContent) {
    const lines = fileContent.trim().split("\n");
    const vertices = [];
    const texCoords = [];
    const normals = [];
    const faces = [];
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(" ");
  
      if (parts[0] === "v") {
        const vertex = parts.slice(1).map(Number);
        vertices.push(...vertex);
      } else if (parts[0] === "vt") {
        const texCoord = parts.slice(1).map(Number);
        texCoord.shift();
        console.log(texCoord);
        texCoords.push(...texCoord);
      } else if (parts[0] === "vn") {
        const normal = parts.slice(1).map(Number);
        normal.shift();
        normals.push(...normal);
      } else if (parts[0] === "f") {
        const faceVertices = [];
        const faceTexCoords = [];
        const faceNormals = [];
  
        for (let j = 1; j < parts.length; j++) {
          const indices = parts[j].split("/");
          const vertexIndex = parseInt(indices[0]) - 1;
          const texCoordIndex = parseInt(indices[1]) - 1;
          const normalIndex = parseInt(indices[2]) - 1;
  
          faceVertices.push(vertexIndex);
          faceTexCoords.push(texCoordIndex);
          faceNormals.push(normalIndex);
        }
  
        faces.push({
          vertices: faceVertices,
          texCoords: faceTexCoords,
          normals: faceNormals,
        });
      }
    }
  
    const sortedVertices = [];
    const sortedTexCoords = [];
    const sortedNormals = [];

    console.log(texCoords)
  
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
  
      for (let j = 0; j < face.vertices.length; j++) {
        const vertexIndex = face.vertices[j];
        const texCoordIndex = face.texCoords[j];
        const normalIndex = face.normals[j];
  
        sortedVertices.push(vertices[vertexIndex * 3], vertices[vertexIndex * 3 + 1], vertices[vertexIndex * 3 + 2]);
        sortedTexCoords.push(texCoords[texCoordIndex * 3], texCoords[texCoordIndex * 3 + 1]);
        sortedNormals.push(normals[normalIndex * 3], normals[normalIndex * 3 + 1], normals[normalIndex * 3 + 2]);
      }
    }

    console.log(sortedTexCoords);
  
    return {
      position: sortedVertices,
      texcoord: sortedTexCoords,
      normal: sortedNormals,
    };
  }