import { IfcViewerAPI } from 'web-ifc-viewer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({container});
viewer.axes.setAxes();
viewer.grid.setGrid();

init();

async function init() {
	const model = await viewer.IFC.loadIfcUrl('test.ifc');
	const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
	console.log(ifcProject);
	const listRoot = document.getElementById('myUL');
	createNode(listRoot, ifcProject.type, ifcProject.children);
	generateTreeLogic();
}


function createNode(parent, text, children) {
	if(children.length === 0) {
		createLeafNode(parent, text);
	} else {


		const types = children.map(child => child.type);
		const uniqueTypes = new Set(types);
		if(uniqueTypes.length === 1) {
			createBranchNode(parent, text, children);
		}
		else {
			const uniquesArray = Array.from(uniqueTypes);
			const categories = uniquesArray.map(type => {
				return { type, children: children.filter(child => child.type.includes(type)) };
			})

			categories.forEach(category => {
				createBranchNode(parent, category.type, category.children)
			})
		}
	}
}

function createBranchNode(parent, text, children) {

	// container
	const nodeContainer = document.createElement('li');
	parent.appendChild(nodeContainer);

	// title
	const title = document.createElement('span');
	title.textContent = text;
	title.classList.add('caret');
	nodeContainer.appendChild(title);

	// children
	const childrenContainer = document.createElement('ul');
	childrenContainer.classList.add('nested');
	nodeContainer.appendChild(childrenContainer);

	children.forEach(child => createNode(childrenContainer, child.type, child.children ));

}

function createLeafNode(parent, text) {
	const leaf = document.createElement('li');
	leaf.textContent = text;
	parent.appendChild(leaf);
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


// const input = document.getElementById('file-input');
// input.onchange = (event) => {
// 	const file = event.target.files[0];
// 	const url = URL.createObjectURL(file);
// 	viewer.IFC.loadIfcUrl(url);
// }

