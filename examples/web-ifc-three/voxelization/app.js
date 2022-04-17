import {
    AmbientLight,
    Matrix4,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    BoxGeometry,
    Mesh,
    InstancedMesh,
    Quaternion,
    MeshLambertMaterial,
    WebGLRenderer,
    Raycaster,
    Vector3,
    Box3,
    Color
} from 'three';
import {IFCWALLSTANDARDCASE, IFCWALL, IFCSLAB, IFCWINDOW, IFCDOOR, IFCPLATE, IFCMEMBER} from 'web-ifc';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {IFCLoader} from 'web-ifc-three/IFCLoader';
import {acceleratedRaycast, computeBoundsTree, disposeBoundsTree} from 'three-mesh-bvh';

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
    width: window.innerWidth,
    height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById('three-canvas');
const renderer = new WebGLRenderer({canvas: threeCanvas, alpha: true});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener('resize', () => {
    (size.width = window.innerWidth), (size.height = window.innerHeight);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
});

const ifcLoader = new IFCLoader();

async function loadIFC() {
    await ifcLoader.ifcManager.setWasmPath('../../../');
    await ifcLoader.ifcManager.applyWebIfcConfig({
        USE_FAST_BOOLS: true,
        COORDINATE_TO_ORIGIN: true,
    });

    // Sets up optimized picking
    await ifcLoader.ifcManager.setupThreeMeshBVH(
        computeBoundsTree,
        disposeBoundsTree,
        acceleratedRaycast);

    const model = await ifcLoader.loadAsync('../../../IFC/01.ifc');
    scene.add(model);
    console.log(model);

    const walls = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALL, false);
    const wallsStandard = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALLSTANDARDCASE, false);
    const slabs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCSLAB, false);
    const doors = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCDOOR, false);
    const windows = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWINDOW, false);
    const members = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCMEMBER, false);
    const plates = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCPLATE, false);

    const subset =  await ifcLoader.ifcManager.createSubset({
        ids: [...walls, ...wallsStandard, ...slabs, ...doors, ...windows, ...members, ...plates],
        scene,
        removePrevious: true,
        modelID: 0,
        applyBVH: true
    })

    // Voxelize
    const resolution = 0.5;
    const {min, max} = subset.geometry.boundingBox;

    const voxelCollider = new Box3();
    voxelCollider.min.set(-resolution / 2, -resolution / 2, -resolution / 2);
    voxelCollider.max.set(resolution / 2, resolution / 2, resolution / 2);

    const voxelizationSize = {
        x: Math.ceil((max.x - min.x) / resolution),
        y: Math.ceil((max.y - min.y) / resolution),
        z: Math.ceil((max.z - min.z) / resolution)
    }

    // 0 is not visited, 1 is empty, 2 is filled
    const voxels = newVoxels(voxelizationSize);


    const voxelGeometry = new BoxGeometry(resolution, resolution, resolution);
    const green = new MeshLambertMaterial({color: 0x00ff00, transparent: true, opacity: 0.2});
    const red = new MeshLambertMaterial({color: 0xff0000, transparent: true, opacity: 0.2});
    const voxelMesh = new Mesh(voxelGeometry, green);
    scene.add(voxelMesh);

    const transformMatrix = new Matrix4();

    const origin = [min.x + resolution / 2, min.y + resolution / 2, min.z + resolution / 2];

    const filledVoxelsMatrices = [];
    const emptyVoxelsMatrices = [];

    // Compute voxels
    for (let i = 0; i < voxelizationSize.x; i++) {
        for (let j = 0; j < voxelizationSize.y; j++) {
            for (let k = 0; k < voxelizationSize.z; k++) {

                voxelMesh.position.set( origin[0] + i * resolution,
                                        origin[1] + j * resolution,
                                        origin[2] + k * resolution);

                voxelMesh.updateMatrixWorld();
                transformMatrix.copy(subset.matrixWorld).invert().multiply(voxelMesh.matrixWorld);
                const hit = subset.geometry.boundsTree.intersectsBox(voxelCollider, transformMatrix);


                voxels[i][j][k] = hit ? 2 : 1;

                const array = hit ? filledVoxelsMatrices : emptyVoxelsMatrices;
                array.push(voxelMesh.matrixWorld.clone());
            }
        }
    }

    // Representation
    const filledVoxels = new InstancedMesh(voxelGeometry, green, filledVoxelsMatrices.length);
    const emptyVoxels = new InstancedMesh(voxelGeometry, red, emptyVoxelsMatrices.length);

    let counter = 0;
    for(let matrix of filledVoxelsMatrices) {
        filledVoxels.setMatrixAt(counter++, matrix);
    }

    scene.add(filledVoxels);


    function newVoxels(voxelizationSize) {
        const newVoxels = [];
        for (let i = 0; i < voxelizationSize.x; i++) {
            const newArray = [];
            newVoxels.push(newArray);
            for (let j = 0; j < voxelizationSize.y; j++) {
                newArray.push(new Uint8Array(voxelizationSize.z));
            }
        }
        return newVoxels;
    }

}


// function getContextTrueNorthRotation(context, rotation = {value: 0}) {
//
//     if (context.TrueNorth.DirectionRatios) {
//         const ratios = context.TrueNorth.DirectionRatios.map(item => item.value);
//         rotation.value += (Math.atan2(ratios[1], ratios[0]) - Math.PI / 2);
//     }
//
//     if (context.ParentContext) {
//         getContextTrueNorthRotation(context.ParentContext, rotation);
//     }
//
//     return rotation.value;
// }

loadIFC();
