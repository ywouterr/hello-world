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
    Triangle,
    Box3,
    Color
} from 'three';
import {IFCRELVOIDSELEMENT, IFCRELFILLSELEMENT, IFCWALLSTANDARDCASE, IFCWALL, IFCGEOMETRICREPRESENTATIONSUBCONTEXT, IFCSLAB, IFCWINDOW, IFCDOOR, IFCPLATE, IFCMEMBER} from 'web-ifc';
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

    // Get north rotation
    const contextsIDs = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCGEOMETRICREPRESENTATIONSUBCONTEXT);
    const contextID = contextsIDs[0];
    const contextProps = await ifcLoader.ifcManager.getItemProperties(0, contextID, true);
    const rotation = {value: 0};
    getContextTrueNorthRotation(contextProps, rotation);
    console.log(rotation.value);

    // Get all walls orientation
    const wallOrientations = {};

    const walls = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALL, false);
    const wallsStandard = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCWALLSTANDARDCASE, false);
    const allWalls = [...walls, ...wallsStandard];

    const raycaster = new Raycaster();
    const mat = new MeshLambertMaterial({visible: false});

    for(let wall of allWalls) {
        // Get the wall geometry
        const wallMesh = await ifcLoader.ifcManager.createSubset({
            modelID: 0,
            ids: [wall],
            removePrevious: true,
            material: mat
        });

        // Get the largest face (triangle) of the wall
        const largestTriangle = new Triangle();
        const tempTriangle = new Triangle();

        for(let i = 0; i < wallMesh.geometry.index.count - 2; i+= 3) {
            const indexA = wallMesh.geometry.index.array[i];
            tempTriangle.a.x = wallMesh.geometry.attributes.position.getX(indexA);
            tempTriangle.a.y = wallMesh.geometry.attributes.position.getY(indexA);
            tempTriangle.a.z = wallMesh.geometry.attributes.position.getZ(indexA);

            const indexB = wallMesh.geometry.index.array[i + 1];
            tempTriangle.b.x = wallMesh.geometry.attributes.position.getX(indexB);
            tempTriangle.b.y = wallMesh.geometry.attributes.position.getY(indexB);
            tempTriangle.b.z = wallMesh.geometry.attributes.position.getZ(indexB);

            const indexC = wallMesh.geometry.index.array[i + 2];
            tempTriangle.c.x = wallMesh.geometry.attributes.position.getX(indexC);
            tempTriangle.c.y = wallMesh.geometry.attributes.position.getY(indexC);
            tempTriangle.c.z = wallMesh.geometry.attributes.position.getZ(indexC);

            if(tempTriangle.getArea() > largestTriangle.getArea()) {
                largestTriangle.copy(tempTriangle);
            }
        }

        // Compare the two wall directions:
        // the one with the greatest distance in front is the wall orientation
        const direction = new Vector3();
        largestTriangle.getNormal(direction)
        // console.log(direction);

        const midPoint = new Vector3();
        const center = largestTriangle.getMidpoint(midPoint);

        raycaster.set(center, direction);
        let result = raycaster.intersectObject(model)
            .filter((found) => {
                const id = model.geometry.attributes.expressID.getX(found.face.a);
                return id !== wall;
            });

        console.log(result);

        const inverseDirection = new Vector3().copy(direction).negate();
        raycaster.set(center, inverseDirection);
        const inverseResult = raycaster.intersectObject(model)
            .filter((found) => {
            const id = model.geometry.attributes.expressID.getX(found.face.a);
            return id !== wall;
        });

        console.log(inverseResult);

        let wallGeometryOrientation = new Vector3();

        if( result.length === 0) {
            wallGeometryOrientation.copy(direction);
        } else if(inverseResult.length === 0) {
            wallGeometryOrientation.copy(inverseDirection);
        } else if(result[0].distance > inverseResult[0].distance) {
            wallGeometryOrientation.copy(direction);
        } else {
            wallGeometryOrientation.copy(inverseDirection);
        }

        wallGeometryOrientation.applyAxisAngle(new Vector3( 0, 1, 0 ), rotation.value);
        console.log(wallGeometryOrientation);

        wallOrientations[wall] = wallGeometryOrientation;
    }

    // Get all windows and doors orientation
    // It's not necesary to compute it geometrically: just find out the wall where they are
    // And they have the same orientation
    const voidsRelations = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCRELVOIDSELEMENT, true);
    const fillsRelations = await ifcLoader.ifcManager.getAllItemsOfType(0, IFCRELFILLSELEMENT, true);

    const elements = {};

    for(let voidRelation of voidsRelations) {
        const elementID = voidRelation.RelatingBuildingElement.value;
        const openingID = voidRelation.RelatedOpeningElement.value;
        if(!elements[elementID]) elements[elementID] = {openings: [], doorsAndWindows: []};
        elements[elementID].openings.push(openingID);
    }

    for(let voidRelation of voidsRelations) {
        const walls = Object.values(elements);
        const opening = voidRelation.RelatedOpeningElement.value;
        const wall = walls.find(element => element.openings.includes(opening));
        wall.doorsAndWindows.push(voidRelation.RelatingBuildingElement.value);
    }

    console.log(elements);
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
