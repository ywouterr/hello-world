const geometryTypes = require("./geometry-types").geometryTypes;
const WebIFC = require('web-ifc/web-ifc-api-node');
const fs = require("fs");

const ifcapi = new WebIFC.IfcAPI();

LoadFile("../../../IFC/01.ifc");

async function LoadFile(filename)
{
    const modelID = await OpenIfc(filename);
    const allItems = GetAllItems(modelID);
    fs.writeFileSync('test.json', JSON.stringify(allItems));
    ifcapi.CloseModel(modelID);
}

async function OpenIfc(filename) {
    const ifcData = fs.readFileSync(filename).toString();
    await ifcapi.Init();
    return ifcapi.OpenModel(ifcData);
}

function GetAllItems(modelID, excludeGeometry = true) {
    const allItems = {}
    const lines = ifcapi.GetAllLines(modelID);
    getAllItemsFromLines(modelID, lines, allItems, excludeGeometry);
    return allItems;
}

function getAllItemsFromLines(modelID, lines, allItems, excludeGeometry) {
    for(let i = 1; i <= lines.size(); i++) {
        try {
            const itemID = lines.get(i);
            const props = ifcapi.GetLine(modelID, itemID);
            props.type = props.__proto__.constructor.name;
            if(excludeGeometry && geometryTypes.has(props.type)) continue;
            allItems[itemID] = props;
        } catch (e) {
            console.log(e);
        }
    }
}