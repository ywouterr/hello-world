import { IfcViewerAPI } from 'web-ifc-viewer';
import { MeshLambertMaterial } from "three"; // material for highlighting

//const scene = new Scene(); // to make subsetting work

// // for fast manual model selection
//import {IFCLoader} from "web-ifc-three/IFCLoader";
// import {
//     acceleratedRaycast,
//     computeBoundsTree,
//     disposeBoundsTree
// } from 'three-mesh-bvh';

// ifcLoader.ifcManager.setupThreeMeshBVH(
//     computeBoundsTree,
//     disposeBoundsTree,
//     acceleratedRaycast);

//const ifcLoader = new IFCLoader();
// for fast manual model selection

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({container});
viewer.axes.setAxes();
viewer.grid.setGrid();
viewer.IFC.setWasmPath("./");

let model;
//model = viewer.IFC.loadIfcUrl('./01.ifc');
init();

async function init() {
	model = await viewer.IFC.loadIfcUrl('./01.ifc');
	//scene.add(model)
	const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
	console.log(ifcProject);
	const listRoot = document.getElementById('myUL');
	createNode(listRoot, ifcProject, ifcProject.children);
	generateTreeLogic();
}

function createNode(parent, text, children) {
	if(children.length === 0) {
		createLeafNode(parent, text.type, text.expressID);
	} else {
		// If there are multiple categories, group them together
		const grouped = groupCategories(children);
		createBranchNode(parent, text, grouped);
	}
}

function createBranchNode(parent, text, children) {

	// container
	const nodeContainer = document.createElement('li');
	parent.appendChild(nodeContainer);

	// title
	const title = document.createElement('span');
	title.textContent = text.type;
	title.classList.add('caret');
	nodeContainer.appendChild(title);

	// children
	const childrenContainer = document.createElement('ul');
	childrenContainer.classList.add('nested');
	nodeContainer.appendChild(childrenContainer);

	children.forEach(child => createNode(childrenContainer, child, child.children ));

}

function createLeafNode(parent, text, id) {
	const leaf = document.createElement('li');
	leaf.classList.add('leaf-node');
	leaf.textContent = text;
	var button = document.createElement("button");
	button.innerHTML = "Show me " + id;
	//button.addEventListener("click", showInViewer(id));
	leaf.appendChild(button);
	parent.appendChild(leaf);
}

function showInViewer(id) {
    //const props = viewer.IFC.getProperties(modelID, id, true, false);
    //console.log(props);
	//highlight(id, model, selectMat)
}

function groupCategories(children) {
	const types = children.map(child => child.type);
	const uniqueTypes = new Set(types);
	if (uniqueTypes.size > 1) {
		const uniquesArray = Array.from(uniqueTypes);
		children = uniquesArray.map(type => {
			return {
				expressID: -1,
				type: type + 'S',
				children: children.filter(child => child.type.includes(type)),
			};
		});
	}
	return children;
}

function generateTreeLogic() {
	const toggler = document.getElementsByClassName("caret");
	for (let i = 0; i < toggler.length; i++) {
		toggler[i].addEventListener("click", function() {
			this.parentElement.querySelector(".nested").classList.toggle("active");
			this.classList.toggle("caret-down");
		});
	}
}

// picking

const selectMat = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.6,
    color: 0xff00ff,
    depthTest: false
})

// function highlight(id, model, material) {
	
// // 	let siblings = [id];
// // 	// if(showSiblings) {
// // 	// 	siblings = giveSame(ifcModels, id);
// // 	// 	//console.log(siblings);
// // 	// }
// // 	// else siblings = [id];

// // 	// const props = await ifcLoader.ifcManager.getItemProperties(model.id, id)
// // 	// console.log("props")
// // 	// console.log(props)

// console.log(viewer)
// console.log(model)

// // 	// Creates subset
// IfcViewerAPI.IFC.loader.ifcManager.createSubset({
// // //	ifcLoader.ifcManager.createSubset({
// 		modelID: model.modelID,
// 		ids: [id],
// 		material: material,
// 		scene: model.parent,//viewer.scene,
// 		removePrevious: true
// 	})
// }

