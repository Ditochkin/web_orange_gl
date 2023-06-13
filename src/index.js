import * as webglUtils from "./webgl-utils.js";

const vs = `
  attribute vec3 a_position;
  attribute vec2 a_texcoord;
  attribute vec3 a_normal;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  varying vec3 v_normal;
  varying vec2 v_texcoord;
  varying vec3 v_vertPos;

  void main() 
  {
    gl_Position = u_projection * u_view * u_world * vec4(a_position, 1.0);
    
    v_normal = normalize(mat3(u_world) * a_normal);
    v_texcoord = a_texcoord;

    vec4 vertPos = u_view * vec4(a_position, 1.0);
    v_vertPos = vec3(vertPos) / vertPos.w;
  }
  `;

const fs = `
  precision mediump float;

  varying vec3 v_normal;
  varying vec2 v_texcoord;
  varying vec3 v_vertPos;  

  uniform vec3 u_lightDirection;
  
  uniform sampler2D uNormalMap;

  void main () 
  {
    float shininessVal = 10.0;
    float diffuseCoefficient = 1.0;
    float specularCoefficient = 1.0;
    float ambientCoefficient = 0.4;

    vec3 ambientColor = vec3(0.5, 0.2, 0.0);
    vec3 diffuseColor = vec3(1.0, 0.5, 0.0);
    vec3 specularColor = vec3(1.0, 1.0, 1.0);

    vec3 normalMap = v_normal + texture2D(uNormalMap, v_texcoord).rgb;
    vec3 N = normalize(normalMap * 2.0 - 1.0);
    vec3 L = normalize(u_lightDirection);
    float lambertian = max(dot(N, L), 0.0);

    vec3 R = normalize(reflect(-L, N));
    vec3 V = normalize(-v_vertPos);
    float specularAngle = max(dot(R, V), 0.0);
    float specular = pow(specularAngle, shininessVal);

    vec3 diffuse = diffuseCoefficient * lambertian * diffuseColor;
    vec3 specularVector = specularCoefficient * specular * specularColor;
    vec3 ambient = ambientCoefficient * ambientColor;

    gl_FragColor = vec4(ambient + diffuse + specularVector, 1.0);
  }
  `;

const canvas = document.getElementById("orange");
initWebGl(canvas)

let meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

async function main() {

    const response = await fetch('src/sphere.obj');
    const obj = await response.text();

    const buffer = parseObjFile(obj);

    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, buffer);

    let mapTexture = getTexture("src//orange.png")
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);

    let lightDir = [1, 1, 1];
    let u_world = new Float32Array(16);
    glMatrix.mat4.identity(u_world);

    const pos = [0, 0, 1.5];
    const view = [0, 0, 1];

    let camera = new Float32Array(16);
    glMatrix.mat4.lookAt(camera, pos, view, [0, 1, 0]);

    let projection = new Float32Array(16);
    glMatrix.mat4.perspective(projection, radian(90), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.0, 1);
    
    let animate = function render(time) {
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(meshProgramInfo.program);

        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);

        let speed = 0.01
        glMatrix.mat4.rotate(u_world, u_world, radian(speed), [1, 1, 0]);

        webglUtils.setUniforms(meshProgramInfo, {
            u_lightDirection: lightDir,
            u_view: camera,
            u_projection: projection,
            u_world: u_world,
        });

        webglUtils.drawBufferInfo(gl, bufferInfo);

        window.requestAnimationFrame(animate);
    }

    animate(0);
}

main();