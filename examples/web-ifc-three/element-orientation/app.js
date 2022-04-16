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

// Setup raycasting

const raycaster = new Raycaster();
const resolution = 1;
const raycastOffset = 1;

const voxels = {
    count: 0,
    matrices: {}
};

const innerVoxels = {
    count: 0,
    matrices: {}
};

const material = new MeshLambertMaterial({color: 0x00ff00, transparent: true, opacity: 0.2});
const innerMaterial = new MeshLambertMaterial({color: 0xff0000, transparent: true, opacity: 0.2});
const geometry = new BoxGeometry(resolution * 0.8, resolution * 0.8, resolution * 0.8);

const rotation = new Quaternion();
const scale = new Vector3(1, 1, 1);

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

    const model = await ifcLoader.loadAsync('../../../IFC/02.ifc');
    scene.add(model);
    model.visible = false;
    console.log(model);

    // model.material.forEach(mat => {
    // 	mat.opacity = 0.2;
    // 	mat.transparent = true;
    // });
    // model.visible = false;

    // Voxelize
    await renderOuterVoxels(model);
    renderInnerVoxels();
    showVoxels();

    // Create a subset with all the walls
    // For each wall >
    //     take the biggest triangle and check a point with some offset in the direction of the normal
    //     voxelize the point
    //     if the voxel exists in the stored voxels, the orientation is the opposite: if not, that normal is the orientation
    //     for windows and doors: check relation objects and the orientation is equivalent to the parent wall


    console.log(voxels);
    console.log(innerVoxels);

}

async function renderOuterVoxels(model) {
    const subset = await getSubsetToVoxelize();
    const min = model.geometry.boundingBox.min;
    const max = model.geometry.boundingBox.max;
    renderVoxels(min, max, subset, 'x', 'y', 'z');
    renderVoxels(min, max, subset, 'z', 'y', 'x');
    renderVoxels(min, max, subset, 'x', 'z', 'y');
}

function renderInnerVoxels() {
    let previousX;
    let previousY;
    let previousZ;

    traverseVoxels(voxels, (index, voxel, x, y, z) => {

        const isStartingNewVoxelRow = previousX !== x || previousY !== y;

        if (!isStartingNewVoxelRow) {

            const matrices = innerVoxels.matrices;
            const count = (z - previousZ - resolution) / resolution;
            for (let i = 0; i < count; i++) {

                innerVoxels.count++;
                const innerZ = previousZ + i * resolution;

                if(matrices[x] === undefined) matrices[x] = {};
                if(matrices[x][y] === undefined) matrices[x][y] = {};

                matrices[x][y][innerZ] = new Matrix4().compose(
                    new Vector3(x, y, innerZ), rotation, scale,
                );

            }

        }

        previousX = x;
        previousY = y;
        previousZ = z;

    })
}


function showVoxels() {

    // const mesh = new InstancedMesh(geometry, material, voxels.count);
    // traverseVoxels(voxels, (index, voxel) => mesh.setMatrixAt(index, voxel));
    // scene.add(mesh);

    const innerMesh = new InstancedMesh(geometry, innerMaterial, innerVoxels.count);
    traverseVoxels(innerVoxels, (index, voxel) => innerMesh.setMatrixAt(index, voxel));
    scene.add(innerMesh);

}

function traverseVoxels(voxelObject, callback) {
    let counter = 0;
    for (const x in voxelObject.matrices) {
        const voxelPlane = voxelObject.matrices[x];
        for (const y in voxelPlane) {
            const voxelArray = voxelPlane[y];
            for (const z in voxelArray) {
                const voxel = voxelArray[z];

                const xFloat = parseFloat(x);
                const yFloat = parseFloat(y);
                const zFloat = parseFloat(z);

                callback(counter++, voxel, xFloat, yFloat, zFloat);
            }
        }
    }
}

function renderVoxels(min, max, mesh, dimension1, dimension2, dimension3, interior = false) {

    const rayCastPosition = new Vector3(min.x, min.y, min.z);
    rayCastPosition[dimension3] -= raycastOffset;
    const rayCastDirection = new Vector3();
    rayCastDirection[dimension3] = 1;

    const iterations1 = getIterationNumber(min, max, dimension1);
    const start1 = min[dimension1] + (resolution / 2);

    const iterations2 = getIterationNumber(min, max, dimension2);
    const start2 = min[dimension2] + (resolution / 2);

    for (let i = 0; i < iterations1; i++) {
        for (let j = 0; j < iterations2; j++) {

            rayCastPosition[dimension1] = start1 + (i * resolution);
            rayCastPosition[dimension2] = start2 + (j * resolution);

            raycaster.set(rayCastPosition, rayCastDirection);
            const results = raycaster.intersectObject(mesh);
            const matrices = voxels.matrices;

            for (const result of results) {
                const {x, y, z} = getVoxelizedPosition(result.point);

                if (matrices[x] === undefined) matrices[x] = {};
                if (matrices[x][y] === undefined) matrices[x][y] = {};
                if (matrices[x][y][z] === undefined) {
                    voxels.count++;
                    matrices[x][y][z] = new Matrix4().compose(
                        new Vector3(x, y, z), rotation, scale,
                    );
                }
            }
        }
    }
}

function getIterationNumber(min, max, dimension) {
    return Math.ceil((max[dimension] - min[dimension]) / resolution);
}

async function getSubsetToVoxelize() {
    const wallsStandardIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALLSTANDARDCASE, false);
    const wallsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALL, false);
    const windowsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWINDOW, false);
    const slabsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCSLAB, false);
    const membersIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCMEMBER, false);
    const platesIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCPLATE, false);
    const doorsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCDOOR, false);
    const ids = [...wallsIDs, ...wallsStandardIDs, ...windowsIDs, ...membersIDs, ...platesIDs, ...doorsIDs, ...slabsIDs];

    return ifcLoader.ifcManager.createSubset({
        modelID: 0,
        ids,
        applyBVH: true,
        removePrevious: true,
    });
}

function getVoxelizedPosition(point) {
    const x = Math.trunc(point.x / resolution) * resolution;
    const y = Math.trunc(point.y / resolution) * resolution;
    const z = Math.trunc(point.z / resolution) * resolution;
    return {x, y, z};
}

function getContextTrueNorthRotation(context, rotation = {value: 0}) {

    if (context.TrueNorth.DirectionRatios) {
        const ratios = context.TrueNorth.DirectionRatios.map(item => item.value);
        rotation.value += (Math.atan2(ratios[1], ratios[0]) - Math.PI / 2);
    }

    if (context.ParentContext) {
        getContextTrueNorthRotation(context.ParentContext, rotation);
    }

    return rotation.value;
}

loadIFC();
