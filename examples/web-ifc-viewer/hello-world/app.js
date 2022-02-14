import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container });
viewer.grid.setGrid();
viewer.axes.setAxes();

viewer.IFC.setWasmPath("../../../");

const input = document.getElementById("file-input");

input.addEventListener("change",

  async (changed) => {

    const file = changed.target.files[0];
    const ifcURL = URL.createObjectURL(file);
    viewer.IFC.loadIfcUrl(ifcURL);
  },

  false
);
