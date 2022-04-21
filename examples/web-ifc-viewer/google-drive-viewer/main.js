import {IfcViewerAPI} from 'web-ifc-viewer';
import {Color} from 'three'

// Get div container where 3d scene is rendered
const container = document.getElementById('viewer-container');

// Initialize IFC.js API and add it as global variable
const viewer = new IfcViewerAPI({container, backgroundColor: new Color(0xffffff)});
viewer.IFC.applyWebIfcConfig({ COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true });
window.webIfcAPI = viewer;

// Set up scene
viewer.axes.setAxes();
viewer.grid.setGrid(50, 50);
viewer.IFC.setWasmPath('wasm/');
viewer.clipper.active = true;
let dimensionsActive = false;

// Add basic input logic
const handleKeyDown = (event) => {
    if (event.code === 'KeyE') {
        dimensionsActive = !dimensionsActive;
        viewer.dimensions.active = dimensionsActive;
        viewer.dimensions.previewActive = dimensionsActive;
        viewer.IFC.selector.unPrepickIfcItems();
        window.onmousemove = dimensionsActive ? null : () => viewer.IFC.selector.prePickIfcItem();
    }
    if (event.code === 'KeyD') {
        viewer.dimensions.create();
    }
    if (event.code === 'KeyG') {
        viewer.clipper.createPlane();
    }
    if (event.code === 'Delete') {
        viewer.dimensions.deleteAll();
        viewer.clipper.deletePlane();
        viewer.IFC.selector.unpickIfcItems();
    }
};
window.onkeydown = handleKeyDown;

// Highlight items when hovering over them
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();

// Select items and log properties
window.ondblclick = async () => {
    const item = await viewer.IFC.selector.pickIfcItem(true);
    if(item.modelID === undefined || item.id === undefined ) return;
    console.log(await viewer.IFC.getProperties(item.modelID, item.id, true));
}