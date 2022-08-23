import { IfcViewerAPI } from "web-ifc-viewer";

const container = document.getElementById("viewer-container");

const viewer = new IfcViewerAPI({ container });
viewer.axes.setAxes();
viewer.grid.setGrid();

let url = "../../../IFC/01.ifc";
let wasmPath = "../../../";

init();

async function init() {
  await viewer.IFC.setWasmPath(wasmPath);
  const model = await viewer.IFC.loadIfcUrl(url);

  // Serialize properties
  const properties = await viewer.IFC.properties.serializeAllProperties(model);
  
  // Download the properties as JSON file
  const file = new File(properties, 'properties');
  const link = document.createElement('a');
  document.body.appendChild(link);
  link.href = URL.createObjectURL(file);
  link.download = 'properties.json';
  link.click();
  link.remove();
};