import { Color, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { IfcViewerAPI } from 'web-ifc-viewer';
import Drawing from 'dxf-writer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
viewer.grid.setGrid();
viewer.axes.setAxes();

viewer.IFC.setWasmPath('../../../');

const input = document.getElementById('file-input');

input.addEventListener('change',

	async (changed) => {

		const file = changed.target.files[0];
		const ifcURL = URL.createObjectURL(file);
		await viewer.IFC.loadIfcUrl(ifcURL);
		await viewer.shadowDropper.renderShadow(0);
	},

	false,
);

let currentPlan;

window.addEventListener('keydown', async (event) => {
	if(event.code === "KeyP") {
		await viewer.plans.computeAllPlanViews(0);

		const edgesName = "exampleEdges";
		const lineMaterial = new LineBasicMaterial({color: 0x000000});
		const meshMaterial = new MeshBasicMaterial();
		await viewer.edges.create(edgesName, 0, lineMaterial, meshMaterial);
		viewer.edges.toggle(edgesName, true);
		
		viewer.shadowDropper.shadows[0].root.visible = false;

		const currentPlans = viewer.plans.planLists[0];
		const planNames = Object.keys(currentPlans);
		const firstPlan = planNames[0];
		currentPlan = viewer.plans.planLists[0][firstPlan];
		await viewer.plans.goTo(0, firstPlan, true);

		viewer.dxf.initializeJSDXF(Drawing);
		viewer.edgesVectorizer.initializeOpenCV(cv);
		await viewer.edgesVectorizer.vectorize(10);
	}
	else if(event.code === "KeyV") {
		const drawingName = "example";

		viewer.dxf.newDrawing(drawingName);

		const polygons = viewer.edgesVectorizer.polygons;
		viewer.dxf.drawEdges(drawingName, polygons, 'projection', Drawing.ACI.BLUE );

		viewer.dxf.drawNamedLayer(drawingName, currentPlan, 'thick', 'section_thick', Drawing.ACI.RED);
		viewer.dxf.drawNamedLayer(drawingName, currentPlan, 'thin', 'section_thin', Drawing.ACI.GREEN);

		const result = viewer.dxf.exportDXF(drawingName);

		const link = document.createElement('a');
		link.download = "floorplan.dxf";
		link.href = URL.createObjectURL(result);
		document.body.appendChild(link);
		link.click();
		link.remove();
	}
})
