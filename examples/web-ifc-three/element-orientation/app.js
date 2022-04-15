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
	InstancedMesh,
	Quaternion,
	MeshLambertMaterial,
	WebGLRenderer,
	Raycaster,
	Vector3,
} from 'three';
import { IFCWALLSTANDARDCASE, IFCWALL, IFCSLAB, IFCWINDOW, IFCDOOR, IFCPLATE, IFCMEMBER } from 'web-ifc';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

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
const threeCanvas = document.getElementById('three-canvas');
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
window.addEventListener('resize', () => {
	(size.width = window.innerWidth), (size.height = window.innerHeight);
	camera.aspect = size.width / size.height;
	camera.updateProjectionMatrix();
	renderer.setSize(size.width, size.height);
});

// Setup raycasting
const raycaster = new Raycaster();
const resolution = 0.5;
const raycastOffset = 1;
const storedPositions = {};
const storedFilledPositions = {};

const material = new MeshLambertMaterial({ color: 0x00ff00, transparent: true, opacity: 0.2 });
const materialFill = new MeshLambertMaterial({ color: 0xff0000, transparent: true, opacity: 0.2 });
const geometry = new BoxGeometry(resolution * 0.8, resolution * 0.8, resolution * 0.8);

const voxelsMatrices = [];
const voxelsFillMatrices = [];
const rotation = new Quaternion();
const scale = new Vector3(1, 1, 1);

const ifcLoader = new IFCLoader();

async function loadIFC() {
	await ifcLoader.ifcManager.setWasmPath('../../../');
	await ifcLoader.ifcManager.applyWebIfcConfig({
		USE_FAST_BOOLS: true,
		COORDINATE_TO_ORIGIN: true,
	});

	// Sets up optimized picking
	await ifcLoader.ifcManager.setupThreeMeshBVH(
		computeBoundsTree,
		disposeBoundsTree,
		acceleratedRaycast);

	const model = await ifcLoader.loadAsync('../../../IFC/01.ifc');
	model.geometry.computeVertexNormals();
	scene.add(model);
	console.log(model);

	const subset = await getSubsetToVoxelize();

	// model.material.forEach(mat => {
	// 	mat.opacity = 0.2;
	// 	mat.transparent = true;
	// });
	// model.visible = false;

	// Voxelize
	const min = model.geometry.boundingBox.min;
	const max = model.geometry.boundingBox.max;

	renderVoxels(min, max, subset, 'x', 'y', 'z');
	renderVoxels(min, max, subset, 'z', 'y', 'x');
	renderVoxels(min, max, subset, 'x', 'z', 'y');
	showVoxels();

	// Fill with voxels the interior
	// Create a subset with all the walls
	// For each wall >
	//     take the biggest triangle and check a point with some offset in the direction of the normal
	//     voxelize the point
	//     if the voxel exists in the stored voxels, the orientation is the opposite: if not, that normal is the orientation
	//     for windows and doors: check relation objects and the orientation is equivalent to the parent wall

	// TODO: When creating the limitation voxels, store minimum voxel coordinates and maximum voxel coordintes and use those as base points

	const offsetMin = new Vector3(min.x - 2 * resolution, min.y - 2 * resolution, min.z - 2 * resolution);
	const offsetMax = new Vector3(max.x + 2 * resolution, max.y + 2 * resolution, max.z + 2 * resolution);

	const voxelizedMin = getVoxelizedPosition({point: offsetMin});
	const voxelizedMax = getVoxelizedPosition({point: offsetMax});

	const xIterations = getIterationNumber(voxelizedMin, voxelizedMax, 'x');
	const yIterations = getIterationNumber(voxelizedMin, voxelizedMax, 'y');
	const zIterations = getIterationNumber(voxelizedMin, voxelizedMax, 'z');

	let fillMode = false;
	let wasLastVoxelFilled = false;
	for(let x = 0; x < xIterations; x++) {
		fillMode = false;
		wasLastVoxelFilled = false;
		for(let y = 0; y < yIterations; y++) {
			fillMode = false;
			wasLastVoxelFilled = false;
			for(let z = 0; z < zIterations; z++) {

				const xPosition = voxelizedMin.x + x * resolution;
				const yPosition = voxelizedMin.y + y * resolution;
				const zPosition = voxelizedMin.z + z * resolution;

				if(isPositionStored(xPosition, yPosition, zPosition)) {
					if(!wasLastVoxelFilled) {
						fillMode = !fillMode;
					}
					wasLastVoxelFilled = true;
				} else {
					if(fillMode) {
						if(!isFillPositionStored(xPosition, yPosition, zPosition)) {
							voxelsFillMatrices.push(new Matrix4().compose(
								new Vector3(xPosition, yPosition, zPosition), rotation, scale,
							));

							storeFilledPosition(xPosition, yPosition, zPosition);
						}
					}
					wasLastVoxelFilled = false;
				}
			}
		}
	}

	showFillVoxels();

	console.log(storedPositions);

}


function showVoxels() {
	const mesh = new InstancedMesh(geometry, material, voxelsMatrices.length);

	for (let i = 0; i < voxelsMatrices.length; i++) {
		mesh.setMatrixAt(i, voxelsMatrices[i]);
	}

	scene.add(mesh);

}

function showFillVoxels() {
	const mesh = new InstancedMesh(geometry, materialFill, voxelsMatrices.length);

	for (let i = 0; i < voxelsFillMatrices.length; i++) {
		mesh.setMatrixAt(i, voxelsFillMatrices[i]);
	}

	scene.add(mesh);

}

function renderVoxels(min, max, mesh, dimension1, dimension2, dimension3, interior = false) {

	const rayCastPosition = new Vector3(min.x, min.y, min.z);
	rayCastPosition[dimension3] -= raycastOffset;
	const rayCastDirection = new Vector3();
	rayCastDirection[dimension3] = 1;

	const iterations1 = getIterationNumber(min, max, dimension1);
	const start1 = min[dimension1] + (resolution / 2);

	const iterations2 = getIterationNumber(min, max, dimension2);
	const start2 = min[dimension2] + (resolution / 2);

	for (let i = 0; i < iterations1; i++) {
		for (let j = 0; j < iterations2; j++) {

			rayCastPosition[dimension1] = start1 + (i * resolution);
			rayCastPosition[dimension2] = start2 + (j * resolution);

			raycaster.set(rayCastPosition, rayCastDirection);
			const results = raycaster.intersectObject(mesh);

			for (const result of results) {
				const voxelizedResult = getVoxelizedPosition(result);
				const { x, y, z } = voxelizedResult;

				// Create voxels for limits
				if (!isPositionStored(x, y, z)) {

					voxelsMatrices.push(new Matrix4().compose(
						new Vector3(x, y, z), rotation, scale,
					));

					storePosition(x, y, z);
				}
			}
		}
	}
}

function getIterationNumber(min, max, dimension) {
	return Math.ceil((max[dimension] - min[dimension]) / resolution);
}

async function getSubsetToVoxelize() {
	const wallsStandardIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALLSTANDARDCASE, false);
	const wallsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALL, false);
	const windowsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWINDOW, false);
	const slabsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCSLAB, false);
	const membersIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCMEMBER, false);
	const platesIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCPLATE, false);
	const doorsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCDOOR, false);
	const ids = [...wallsIDs, ...wallsStandardIDs, ...windowsIDs, ...membersIDs, ...platesIDs, ...doorsIDs, ...slabsIDs];

	return ifcLoader.ifcManager.createSubset({
		modelID: 0,
		ids,
		applyBVH: true,
		removePrevious: true,
	});
}

function getVoxelizedPosition(result) {
	const x = Math.trunc(result.point.x / resolution) * resolution;
	const y = Math.trunc(result.point.y / resolution) * resolution;
	const z = Math.trunc(result.point.z / resolution) * resolution;
	return { x, y, z };
}

function isPositionStored(x, y, z) {
	return storedPositions[x] !== undefined && storedPositions[x][y] !== undefined && storedPositions[x][y][z] !== undefined;
}

function isFillPositionStored(x, y, z) {
	return storedFilledPositions[x] !== undefined && storedFilledPositions[x][y] !== undefined && storedFilledPositions[x][y][z] !== undefined;
}

function storePosition(x, y, z) {
	if (!storedPositions[x]) {
		storedPositions[x] = { x };
	}

	if (!storedPositions[x][y]) {
		storedPositions[x][y] = { y };
	}

	storedPositions[x][y][z] = z;
}

function storeFilledPosition(x, y, z) {
	if (!storedFilledPositions[x]) {
		storedFilledPositions[x] = { x };
	}

	if (!storedFilledPositions[x][y]) {
		storedFilledPositions[x][y] = { y };
	}

	storedFilledPositions[x][y][z] = z;
}

function getContextTrueNorthRotation(context, rotation = { value: 0 }) {

	if (context.TrueNorth.DirectionRatios) {
		const ratios = context.TrueNorth.DirectionRatios.map(item => item.value);
		rotation.value += (Math.atan2(ratios[1], ratios[0]) - Math.PI / 2);
	}

	if (context.ParentContext) {
		getContextTrueNorthRotation(context.ParentContext, rotation);
	}

	return rotation.value;
}

loadIFC();
