import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container });
viewer.IFC.setWasmPath('../../../');
viewer.IFC.loadIfcUrl('../../../IFC/01.ifc');

function pick() {
	const result = viewer.context.castRayIfc();
	console.log(result);
	if (!result) return;
	const manager = viewer.IFC.loader.ifcManager;
	const id = manager.getExpressId(result.object.geometry, result.faceIndex);
    output.innerHTML = id;
}
const output = document.getElementById("id-output");

window.ondblclick = () => pick(viewer);
