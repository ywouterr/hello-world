import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
    Plane,
    Vector2,
    Vector3,
    DepthTexture,
    WebGLRenderTarget,
  WebGLRenderer,
} from "three";

import {IFCSPACE, IFCOPENINGELEMENT} from 'web-ifc';

import Stats from "three/examples/jsm/libs/stats.module";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import {CustomOutlinePass} from "./CustomOutlinePass";
import {SAOPass} from "three/examples/jsm/postprocessing/SAOPass";

//Creates the Three.js scene
const scene = new Scene();

//Sets up the renderer, fetching the canvas of the HTML
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates stats
const stats = Stats();
document.body.appendChild(stats.dom);

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

// Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
// controls.enableDamping = true;
controls.target.set(-2, 0, 0);

// Set up post processing
// Create a render target that holds a depthTexture so we can use it in the postproduction pass
// See: https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderTarget.depthBuffer
const depthTexture = new DepthTexture();
const renderTarget = new WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      depthTexture: depthTexture,
      depthBuffer: true
    }
);

// Initial render pass.
const composer = new EffectComposer(renderer, renderTarget);
const pass = new RenderPass(scene, camera);
composer.addPass(pass);

// const fxaaPass = new ShaderPass(FXAAShader);
const saoPass = new SAOPass(scene, camera, false, true);

saoPass.enabled = true;
saoPass.params.saoIntensity = 0.02;
saoPass.params.saoBias = 0.5;
saoPass.params.saoBlurRadius = 8;
saoPass.params.saoBlurDepthCutoff = 0.0015;
saoPass.params.saoScale = 30;
saoPass.params.saoKernelRadius = 30;

// composer.addPass(fxaaPass);
composer.addPass(saoPass);

// Outline pass.
const customOutline = new CustomOutlinePass(
    new Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);
composer.addPass(customOutline);

// Antialias pass.
const effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
);
composer.addPass(effectFXAA);


// Animation loop
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  // composer.render();

  stats.update();
  requestAnimationFrame(animate);
};

animate();

const img = document.getElementById('overlay');

let isMouseDown = false;
onmousedown = () => {
  isMouseDown = true;
  hideSaoPass();
}

onmouseup = () => {
  isMouseDown = false;
  updateSaoPass();
}

let lastWheeled = 0;
let waitingTime = 500;
onwheel = () => {
  hideSaoPass();
  lastWheeled = performance.now();
  setTimeout(() => {
    const userStoppedWheeling = performance.now() - lastWheeled >= waitingTime;
    if(userStoppedWheeling && !isMouseDown) {
      updateSaoPass();
    }
  }, waitingTime)
}

function hideSaoPass() {
  img.classList.add('collapsed');
}

function updateSaoPass() {
  grid.visible = false;
  composer.render();
  img.src = renderer.domElement.toDataURL();
  grid.visible = true;
  img.classList.remove('collapsed');
}

setTimeout(() => updateSaoPass(), 300);


// const plane = new Plane(new Vector3(0, -2, 0), 1.5);
// renderer.clippingPlanes = [plane];

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  (size.width = window.innerWidth), (size.height = window.innerHeight);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  composer.setSize(size.width, size.height);
  renderer.setSize(size.width, size.height);
});

//Sets up the IFC loading
const ifcLoader = new IFCLoader();

async function loadIfc() {
  await ifcLoader.ifcManager.setWasmPath("../../../");

  await ifcLoader.ifcManager.applyWebIfcConfig({
    USE_FAST_BOOLS: true,
    COORDINATE_TO_ORIGIN: true
  });

  await ifcLoader.ifcManager.parser.setupOptionalCategories({
    [IFCSPACE]: false,
    [IFCOPENINGELEMENT]: false
  });

  ifcLoader.load("../../../IFC/01.ifc", (ifcModel) => {
    scene.add(ifcModel);
  });
}

loadIfc();


//GUI
const gui = new GUI();

const params = {
  mode: { Mode: 0 },
  FXAA: true,
  outlineColor: 0xffffff,
  depthBias: 16,
  depthMult: 83,
  normalBias: 5,
  normalMult: 1.0
};
const uniforms = customOutline.fsQuad.material.uniforms;
gui
    .add(params.mode, "Mode", {
      Outlines: 0,
      "Original scene": 1,
      "Depth buffer": 2,
      "Normal buffer": 3,
      "Outlines only": 4
    })
    .onChange(function (value) {
      uniforms.debugVisualize.value = value;
    });

// Initial values
uniforms.outlineColor.value.set(0x6b6b6b);
uniforms.multiplierParameters.value.x = params.depthBias;
uniforms.multiplierParameters.value.y = params.depthMult;
uniforms.multiplierParameters.value.z = params.normalBias;
uniforms.multiplierParameters.value.w = params.normalMult;

gui.addColor(params, "outlineColor").onChange(function (value) {
  uniforms.outlineColor.value.set(value);
});

gui.add(params, "depthBias", 0.0, 500).onChange(function (value) {
  uniforms.multiplierParameters.value.x = value;
});
gui.add(params, "depthMult", 0.0, 500).onChange(function (value) {
  uniforms.multiplierParameters.value.y = value;
});
gui.add(params, "normalBias", 0.0, 500).onChange(function (value) {
  uniforms.multiplierParameters.value.z = value;
});
gui.add(params, "normalMult", 0.0, 500).onChange(function (value) {
  uniforms.multiplierParameters.value.w = value;
});