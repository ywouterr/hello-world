const geometryTypes = require("./geometry-types").geometryTypes;
const WebIFC = require('web-ifc/web-ifc-api-node');
const fs = require("fs");

const ifcapi = new WebIFC.IfcAPI();

LoadFile("../../../../IFC/7/Tungasletta10_R01.ifc");

async function LoadFile(filename)
{
    const modelID = await OpenIfc(filename);
    const allItems = GetAllItems(modelID);
    fs.writeFileSync('../../../../IFC/7/Tungasletta10_R01.json', JSON.stringify(allItems));
    ifcapi.CloseModel(modelID);
}

async function OpenIfc(filename) {
    const ifcData = fs.readFileSync(filename);
    await ifcapi.Init();
    return ifcapi.OpenModel(ifcData);
}

function GetAllItems(modelID, excludeGeometry = true) {
    const allItems = {};
    const lines = ifcapi.GetAllLines(modelID);
    getAllItemsFromLines(modelID, lines, allItems, excludeGeometry);
    return allItems;
}

function getAllItemsFromLines(modelID, lines, allItems, excludeGeometry) {
    for(let i = 1; i <= lines.size(); i++) {
        try {
            saveProperties(modelID, lines, allItems, excludeGeometry, i);
        } catch (e) {
            console.log(e);
        }
    }
}

function saveProperties(modelID, lines, allItems, excludeGeometry, index) {
    const itemID = lines.get(index);
    const props = ifcapi.GetLine(modelID, itemID);
    props.type = props.__proto__.constructor.name;
    if(!excludeGeometry || !geometryTypes.has(props.type)) {
        allItems[itemID] = props;
    }
}