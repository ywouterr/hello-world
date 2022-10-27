import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { NavCube } from "./NavCube/NavCube";

const container = document.getElementById("viewer-container");
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
viewer.grid.setGrid();
viewer.axes.setAxes();
var model;
async function loadIfc(url) {
	await viewer.IFC.setWasmPath("../../../");
	model = await viewer.IFC.loadIfcUrl(url);
	viewer.shadowDropper.renderShadow(model.modelID);
}

loadIfc("../../../IFC/01.ifc");

//Nave cube
viewer.container = container;
const navCube = new NavCube(viewer);
navCube.onPick(model);
window.ondblclick = () => viewer.IFC.selector.pickIfcItem(true);
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
viewer.clipper.active = true;

window.onkeydown = (event) => {
	if (event.code === "KeyP") {
		viewer.clipper.createPlane();
	} else if (event.code === "KeyO") {
		viewer.clipper.deletePlane();
	}
};
