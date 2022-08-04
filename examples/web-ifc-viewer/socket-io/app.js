import {
    Color
} from 'three';
import {
    CSS2DObject
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import {
    IfcViewerAPI
} from 'web-ifc-viewer';

let socket;
let clients = {};
let pointers = {};

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({
    container,
    backgroundColor: new Color(0xffffff)
});
viewer.grid.setGrid();
viewer.axes.setAxes();

async function loadIfc(url) {
    await viewer.IFC.setWasmPath("./");
    const model = await viewer.IFC.loadIfcUrl(url);
    viewer.shadowDropper.renderShadow(model.modelID);
}

loadIfc('./static/01.ifc');


function connectToSocket() {
    const initials = document.getElementById("initials-name").value;
    console.log(initials)

    if (initials) {
        const connectButton = document.getElementById("socket-Connect-Button");
        connectButton.innerHTML = "Connected!";
        connectButton.disabled = true;

        socket = io();
        console.log(initials + ":Connecting to socket");
        socket.emit('username', initials);

        socket.on('camera_move', function (data) {
            if (!clients.hasOwnProperty(data.id)) {
                const labelDiv = document.createElement('div');
                labelDiv.className = 'label';
                labelDiv.textContent = data.initials;
                labelDiv.style.marginTop = '-1em';
                pointers[data.id] = new CSS2DObject(labelDiv);
                pointers[data.id].position.set(data.x, data.y, data.z);
                viewer.context.scene.add(pointers[data.id]);
                pointers[data.id].layers.set(0);
            }

            pointers[data.id].position.set(data.x, data.y, data.z);

            clients[data.id] = data;
        });


        viewer.context.ifcCamera.cameraControls.addEventListener('update', e => {
            const mousePos = {
                "initials": initials,
                "id": "",
                "x": viewer.context.getCamera().position.x,
                "y": viewer.context.getCamera().position.y,
                "z": viewer.context.getCamera().position.z
            }
            socket.emit('camera_move', mousePos);
        })
    }
}

window.ondblclick = () => viewer.IFC.selector.pickIfcItem(true);
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
viewer.clipper.active = true;
window.onkeydown = (event) => {
    if (event.code === 'KeyP') {
        viewer.clipper.createPlane();
    } else if (event.code === 'KeyO') {
        viewer.clipper.deletePlane();
    }
}


window.connectToSocket = connectToSocket;