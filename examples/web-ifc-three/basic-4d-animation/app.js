import {
	AmbientLight,
	AxesHelper,
	DirectionalLight,
	GridHelper,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	MeshLambertMaterial,
	Matrix4
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
} from 'three-mesh-bvh';

import { ProductVisibility} from './components/ProductVisibility';
import { TaskProcessor } from './components/TaskProcessor';
import { IfcHelper } from './components/IfcHelper';
import { GUI } from './components/GUI.js';
// HTML ELEMENTS

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
	width: window.innerWidth,
	height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.set(10, 10, 10);

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
ifcLoader.ifcManager.setWasmPath('../../../');

// Sets up optimized picking
ifcLoader.ifcManager.setupThreeMeshBVH(
	computeBoundsTree,
	disposeBoundsTree,
	acceleratedRaycast);

//Adjust the viewport to the size of the browser
window.addEventListener('resize', () => {
	(size.width = window.innerWidth), (size.height = window.innerHeight);
	camera.aspect = size.width / size.height;
	camera.updateProjectionMatrix();
	renderer.setSize(size.width, size.height);
});


let allObjectIds = [];
function getAllIds(ifcModel) {
	return Array.from(
		new Set(ifcModel.geometry.attributes.expressID.array),
	);
}

// Load FILE Button 
const input = document.getElementById("file-input")
input.addEventListener(
  "change",
  async (changed) => {
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
	await loadIFC(ifcURL)
  },
  false
);

// 4D ANIMATION CODE
const taskProcessor = new TaskProcessor()
const gui = new GUI()
const helper = new IfcHelper() 
const productVisibility = new ProductVisibility(ifcLoader.ifcManager)

// Load Example Model 
let loadButton = gui.createButton('loadButton','Load Example', document.body)

loadButton.style.left = "30vh"
loadButton.onclick = async function(){
	await loadIFC('../../../IFC/MAD_SCIENTIST_212.ifc')
}

async function loadIFC(url){
	const firstModel = Boolean(ifcModels.length === 0);
	ifcLoader.ifcManager.applyWebIfcConfig({
		COORDINATE_TO_ORIGIN: firstModel,
		USE_FAST_BOOLS: false
	});
	const ifcModel = await ifcLoader.loadAsync(url);
	if (firstModel) {
		const matrixArr = await ifcLoader.ifcManager.ifcAPI.GetCoordinationMatrix(ifcModel.modelID);
		const matrix = new Matrix4().fromArray(matrixArr);
		ifcLoader.ifcManager.setupCoordinationMatrix(matrix);
	}
	ifcModels.push(ifcModel);
	scene.add(ifcModel);
	allObjectIds = getAllIds(ifcModel)
	
	gui.hideDomElement(loadButton)
	gui.hideDomElement(document.getElementById('file-input'))

	await createScheduleSelector(ifcModel)

	//Magic function to load Data
	window.Manager = ifcLoader.ifcManager
}

async function createScheduleSelector(ifcModel){
	// Each Work Schedule contains Tasks - Let's Retrieve the WorkSchedule First
	const schedules = await helper.getSchedules(ifcLoader.ifcManager, ifcModel.modelID)

	if (schedules) {
		// The IfcManager has a data class for Scheduling Data:
		await ifcLoader.ifcManager.sequenceData.load(ifcModel.modelID) // Load your Model's data
		 
		// Create Work Schedule Selector
		gui.createScheduleSelector(schedules)

		// Create Button to Create Animation GUI  && Load Related Schedule Tasks
		document.getElementById('loadScheduleTasks').onclick = async function() {
			const filteredTasks = await helper.loadScheduleTasks(ifcLoader.ifcManager, ifcModel.modelID, gui.getSelectedSchedule())
			createAnimationGUI(filteredTasks)
			
		}
	}
}

function createAnimationGUI(tasks){
	//Create Animation GUI
	gui.createAnimationGUI()

	gui.getGuessDatesButton().onclick = function() {
		if (tasks){
			let dates = taskProcessor.guessTasksDateRange(tasks)
			gui.setDates(dates.EarliestStart, dates.LatestStart)
		}
	};

	gui.getStartAnimationButton().onclick = function() {
		if (tasks && gui.hasUserDates()){
			dates = gui.getDates()
			let settings = {
				"startDate": new Date(dates.start),
				"finishDate": new Date(dates.finish),
				"frameRate": Number(gui.getFrameRate()),
				"startFrame": 1,
				"animationType": gui.getAnimationType()
			}

			startAnimation(tasks, settings, ifcModels[0])
		
		}

		else{
				alert("Please enter a valid date")
		}
	}
}

function startAnimation(tasks, settings, model){
	// Process Tasks into Key Frame data.
	taskProcessor.setOptions(settings)
	taskProcessor.preprocessTasks(tasks)

	// Remove Initially Applied Texture
	productVisibility.removeTexture(model, scene)

	// Show Objects which are unassigned to Tasks
	productVisibility.showContext(taskProcessor.getUnassignedProducts(allObjectIds), scene)

	// SetUp Manual Slider based on Total Frame Count.
	gui.setupKeyFrameTimeline(settings, taskProcessor.getTotalFrames()); 
	let timeLineData = taskProcessor.getKeyFramesTimeLine()

	//Give The Slider the power to Toggle Product Visibility
	setSliderControls(gui.slider, settings.animationType, timeLineData, productVisibility)

	//Create Dom Element to Show Date Results
	gui.createDateOutput()
}

function setSliderControls(slider, animationType, keyFramesData, productVisibility){
	if (animationType == 'Cumulative'){
		setCumulativeAnimation(slider, keyFramesData, productVisibility)
	}
	else if (animationType == 'Isolated Tasks'){
		setIsolatedTaskAnimation(slider, keyFramesData, productVisibility) // Set Automatic Slider
	}
}

function setCumulativeAnimation(slider, keyFramesData, productVisibility){
	taskProcessor.setCumulativeFrames(keyFramesData)
	slider.addEventListener('input', () => {
		let frame = keyFramesData[slider.value]
		if (frame.ShowCumulative.length > 0 ){
			productVisibility.showSimulation(frame.ShowCumulative, scene)
			let unhighlightProducts = taskProcessor.getRemainingProducts(frame.ShowCumulative)
			productVisibility.highlightObjects(unhighlightProducts, scene)	
		}
		taskProcessor.animateDateOutput(slider.value, gui.getDateOutput())
	})
}

function setIsolatedTaskAnimation(slider, keyFramesData, productVisibility){
	slider.addEventListener('input', () => {
		let frame = keyFramesData[slider.value]
		if (frame.Show > 0){
			productVisibility.showSimulation(frame.Show,scene)
		}
		taskProcessor.animateDateOutput(slider.value, gui.getDateOutput())
	})
}

//Animation loop
const animate = () => {
	controls.update();
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
};

animate();