import {
  AmbientLight,
  Matrix4,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  BoxGeometry,
  Mesh,
  MeshLambertMaterial,
  WebGLRenderer,
  Raycaster,
  Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IFCWALLSTANDARDCASE } from "web-ifc";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  (size.width = window.innerWidth), (size.height = window.innerHeight);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

// Setup raycasting
const raycaster = new Raycaster();
const resolution = 1;
const zOffset = 1;
const rayCastDirection = new Vector3(0, 0, 1);

const ifcLoader = new IFCLoader();

async function loadIFC() {
  await ifcLoader.ifcManager.setWasmPath("../../../");

  // Sets up optimized picking
  await ifcLoader.ifcManager.setupThreeMeshBVH(
      computeBoundsTree,
      disposeBoundsTree,
      acceleratedRaycast);

  const model = await ifcLoader.loadAsync('../../../IFC/01.ifc');
  scene.add(model);

  // Voxelize
  console.log(model);
  const min = model.geometry.boundingBox.min;
  const max = model.geometry.boundingBox.max;

  const xIterations =  Math.ceil((max.x - min.x) / resolution);
  const yIterations =  Math.ceil((max.y - min.y) / resolution);

  const rayCastPosition = new Vector3(0, 0, min.z - zOffset);

  const startX = min.x + (resolution / 2);
  const startY = min.y + (resolution / 2);

  const storedPositions = {};

  const geometry = new BoxGeometry( 1, 1, 1 );
  const material = new MeshLambertMaterial( {color: 0x00ff00} );

  for(let xIteration = 0; xIteration < xIterations; xIteration++) {
    for(let yIteration = 0; yIteration < yIterations; yIteration++) {

    rayCastPosition.x = startX + (xIteration * resolution);
    rayCastPosition.y = startY + (yIteration * resolution);

      raycaster.set(rayCastPosition, rayCastDirection);
      const results = raycaster.intersectObject(model);
      console.log(results);


      for(const result of results) {
        const cube = new Mesh(geometry, material);

        const x = Math.trunc(result.point.x / resolution) * resolution;
        const y = Math.trunc(result.point.y / resolution) * resolution;
        const z = Math.trunc(result.point.z / resolution) * resolution;

        if(!storedPositions[x] || !storedPositions[x][y] || !storedPositions[x][y][z]) {
          cube.position.set(x, y, z);
          scene.add(cube);
        }

      }
    }
  }

  // const allWallsIDs = await ifcLoader.ifcManager.getAllItemsOfType(model.modelID, IFCWALLSTANDARDCASE, false);
  // console.log(allWallsIDs);
  //
  // for(const wallID of allWallsIDs) {
  //
  //
  //
  // }

  // console.log(model);
}

function getContextTrueNorthRotation(context, rotation = {value: 0}) {

  if(context.TrueNorth.DirectionRatios) {
    const ratios = context.TrueNorth.DirectionRatios.map(item => item.value);
    rotation.value += (Math.atan2(ratios[1], ratios[0]) - Math.PI / 2);
  }

  if(context.ParentContext) {
    getContextTrueNorthRotation(context.ParentContext, rotation);
  }

  return rotation.value;
}

loadIFC();
