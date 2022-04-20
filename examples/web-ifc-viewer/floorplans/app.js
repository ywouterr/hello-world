import { Color, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { IfcViewerAPI } from 'web-ifc-viewer';
import Drawing from 'dxf-writer';
import { IFCWINDOW, IFCPLATE, IFCMEMBER, IFCWALL, IFCWALLSTANDARDCASE, IFCSLAB, IFCFURNISHINGELEMENT, IFCDOOR } from 'web-ifc';
import {ClippingEdges} from 'web-ifc-viewer/dist/components/display/clipping-planes/clipping-edges';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
viewer.grid.setGrid();
viewer.axes.setAxes();

viewer.IFC.setWasmPath('../../../');

const input = document.getElementById('file-input');
let model;

input.addEventListener('change',

	async (changed) => {

		const file = changed.target.files[0];
		const ifcURL = URL.createObjectURL(file);
		model = await viewer.IFC.loadIfcUrl(ifcURL);
		await viewer.shadowDropper.renderShadow(0);
	},

	false,
);

let currentPlan;

// First, let's define the categories that we want to draw
const clippingMaterial = new LineMaterial();
const categories = {
	windows: {
		sectionName: "windows_section",
		projectionName: "windows_projection",
		style: 'CONTINUOUS',
		projectionColor: Drawing.ACI.RED,
		sectionColor: Drawing.ACI.RED,
		value: [IFCWINDOW, IFCPLATE, IFCMEMBER],
		stringValue: ["IFCWINDOW", "IFCPLATE", "IFCMEMBER"],
		material: clippingMaterial
	},
	walls: {
		sectionName: "walls_section",
		projectionName: "walls_projection",
		style: 'CONTINUOUS',
		projectionColor: Drawing.ACI.RED,
		sectionColor: Drawing.ACI.RED,
		value: [IFCWALL, IFCWALLSTANDARDCASE],
		stringValue: ["IFCWALL", "IFCWALLSTANDARDCASE"],
		material: clippingMaterial
	},
	floors: {
		sectionName: "floors_section",
		projectionName: "floors_projection",
		style: 'CONTINUOUS',
		projectionColor: Drawing.ACI.RED,
		sectionColor: Drawing.ACI.RED,
		value: [IFCSLAB],
		stringValue: ["IFCSLAB"],
		material: clippingMaterial
	},
	doors: {
		sectionName: "doors_section",
		projectionName: "doors_projection",
		style: 'CONTINUOUS',
		projectionColor: Drawing.ACI.RED,
		sectionColor: Drawing.ACI.RED,
		value: [IFCDOOR],
		stringValue: ["IFCDOOR"],
		material: clippingMaterial
	},
	furniture: {
		sectionName: "furniture_section",
		projectionName: "furniture_projection",
		style: 'CONTINUOUS',
		projectionColor: Drawing.ACI.RED,
		sectionColor: Drawing.ACI.RED,
		value: [IFCFURNISHINGELEMENT],
		stringValue: ["IFCFURNISHINGELEMENT"],
		material: clippingMaterial
	},
};

// This indicates which floor plan we are exporting
let planIndex = 0;

// This indicates which category we are exporting
let categoryIndex = 0;

// Materials for drawing the projected items
const lineMaterial = new LineBasicMaterial({color: 0x000000});
const meshMaterial = new MeshBasicMaterial();

// The spatial tree of the IFC, necesary to know which elements of which categories are in which floor plan
let spatialTree;

window.addEventListener('keydown', async (event) => {
	if (event.code === 'KeyP') {

		initializeDxfExporter();

		// Initialize the spatial tree
		spatialTree = await viewer.IFC.getSpatialStructure(model.modelID, false);

		// We will create custom styling for clipping lines, so we must disable this
		ClippingEdges.createDefaultIfcStyles = false;

		// This prevents the user messes up by trying to move around
		blockUserInput(true);

		// Let's hide the original IFC model
		model.visible = false;

		// We must hide the dropped shadows (if any)
		toggleAllShadowsVisibility(false);

		// This creates the layers of the all objects that are sectioned
		await createClippingLayers();

		// This computes all the floor plans based on the IFC information
		await viewer.plans.computeAllPlanViews(model.modelID);

		// Now, let's draw all the floor plans!
		await exportFloorPlanToDxf()
	}
});

async function exportFloorPlanToDxf() {

	// Get the current plan
	const currentPlans = viewer.plans.planLists[0];
	const planNames = Object.keys(currentPlans);
	const currentPlanName = planNames[planIndex];
	const currentPlan = currentPlans[currentPlanName];

	// Go to that plan
	await viewer.plans.goTo(model.modelID, currentPlanName, false);

	// Isolate the current category in the current floor plan
	const categoryNames = Object.keys(categories);
	const currentCategoryName = categoryNames[categoryIndex++];
	const currentCategory = categories[currentCategoryName];

	const storeys = spatialTree.children[0].children[0].children;
	const currentStorey = storeys[planIndex];
	const ids = currentStorey.children
		.filter(child => currentCategory.stringValue.includes(child.type))
		.map(item => item.expressID);

	// Create a geometry of edges of the current category
	const subset = viewer.IFC.loader.ifcManager.createSubset({
		modelID: model.modelID,
		ids,
		removePrevious: true,
		scene: viewer.context.getScene()
	})

	const edgesName = `${currentPlanName}_${currentCategory}`;
	await viewer.edges.createFromMesh(edgesName, subset, lineMaterial, meshMaterial);
	viewer.edges.toggle(edgesName, true);

	// This logic will trigger when the opencv vectorizer has finished
	viewer.edgesVectorizer.onVectorizationFinished = () => {

		viewer.edgesVectorizer.currentBucketIndex = 0;
		viewer.edgesVectorizer.buckets = [];

		// Create a new drawing (if it doesn't exist)
		const drawingName = `Drawing_${currentPlanName}`;
		if(!viewer.dxf.drawings[drawingName]) viewer.dxf.newDrawing(drawingName);

		// Get the projected lines of the current category
		const polygons = viewer.edgesVectorizer.polygons;
		viewer.dxf.drawEdges(drawingName, polygons, currentCategory.projectionName,currentCategory.projectionColor);

		viewer.edges.toggle(edgesName, false);

		// If we have drawn all the projected items of this floor
		if(categoryIndex > categoryNames.length - 1) {

			// Draw all sectioned items of this floor
			for(let categoryName in categories) {
				const category = categories[categoryName];
				viewer.dxf.drawNamedLayer(drawingName, currentPlan, category.sectionName, category.sectionName, category.sectionColor);
			}

			// Export the DXF file
			const result = viewer.dxf.exportDXF(drawingName);
			const link = document.createElement('a');
			link.download = "floorplan.dxf";
			link.href = URL.createObjectURL(result);
			document.body.appendChild(link);
			link.click();
			link.remove();

			viewer.dxf.drawings = {};

			// Go to the next floor plan (if this is not the last one)
			planIndex++;
			if(planIndex <= planNames.length - 1) {
				categoryIndex = 0;
				exportFloorPlanToDxf();
			} else {

				// We are finished! Let's give the user control back
				viewer.plans.exitPlanView(false);
				model.visible = true;
				blockUserInput(false);

			}

		} else {
			// This is not the last category of this floor plan
			// So draw the let's draw the next category in this floor
			exportFloorPlanToDxf();
		}
	};

	setTimeout(() => viewer.edgesVectorizer.vectorize(10), 100);
}

function toggleAllShadowsVisibility(visible) {
	for(const shadowName in viewer.shadowDropper.shadows) {
		const shadow = viewer.shadowDropper.shadows[shadowName];
		shadow.root.visible = visible;
	}
}

function initializeDxfExporter() {
	viewer.dxf.initializeJSDXF(Drawing);
	// For this, you need to import opencv in the html
	viewer.edgesVectorizer.initializeOpenCV(cv);
}

function blockUserInput(block) {
	viewer.context.renderer.blocked = block;
	viewer.context.ifcCamera.toggleUserInput(!block);
}

async function createClippingLayers() {
	for (let categoryName in categories) {
		const cat = categories[categoryName];
		await ClippingEdges.newStyle(cat.sectionName, cat.value, cat.material);
	}
}
