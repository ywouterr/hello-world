import {
	AmbientLight,
	AxesHelper,
	DirectionalLight,
	GridHelper,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
} from 'three-mesh-bvh';

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

//Sets up the IFC loading
const ifcModels = [];
const ifcLoader = new IFCLoader();

let allObjects = [];
ifcLoader.ifcManager.setWasmPath('../../../');
const ifc = ifcLoader.ifcManager;

ifcLoader.load('../../../IFC/MAD_SCIENTIST_212.ifc', async (ifcModel) => {
	ifcModels.push(ifcModel);
	allObjects = new Set(ifcModel.geometry.attributes.expressID.array)
	scene.add(ifcModel)

	// It is best to check if the project has any Work Schedules before loading schedule data
	let schedules = await ifc.byType(ifcModel.modelID, "IfcWorkSchedule")
	if (schedules) {
		await loadScheduleData(ifcModel.modelID)
	}
});

// Loads schedule Data
async function loadScheduleData(ifcModelId){
	await ifc.sequenceData.load(ifcModelId)

	// Gives you all sequence Data....
	const sequenceData = ifc.sequenceData
	console.log(sequenceData)

	//..Such as Workplans, Workschedules, Tasks and entities
	const tasks = sequenceData.tasks
	const workSchedules = sequenceData.workSchedules

	processTasks(tasks)
}

function processTasks(tasks){
	const randomTask = tasks[Object.keys(tasks)[25]]
	console.log(randomTask)

	// The TaskTime entity is conveniently given at the Task object
	const randomTaskTime = randomTask.TaskTime
	const scheduledStartDate = new Date(randomTaskTime.ScheduleStart.value)
	const scheduledFinishDate = new Date(randomTaskTime.ScheduleFinish.value)
	const scheduledDuration = randomTaskTime.ScheduleDuration.value

	// Outputs are given at the Task object aswell.
	const productIds = randomTask.Outputs // Array of ExpressIds of what should be Building Element entities
	console.log(productIds) // Ouputs are the result of the process, like a finished product --> A wall, a column, a door, etc.
} 

//Adjust the viewport to the size of the browser
window.addEventListener('resize', () => {
	(size.width = window.innerWidth), (size.height = window.innerHeight);
	camera.aspect = size.width / size.height;
	camera.updateProjectionMatrix();
	renderer.setSize(size.width, size.height);
});

// Sets up optimized picking
ifcLoader.ifcManager.setupThreeMeshBVH(
	computeBoundsTree,
	disposeBoundsTree,
	acceleratedRaycast);

//Animation loop
const animate = () => {
	controls.update();
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
};

animate();

