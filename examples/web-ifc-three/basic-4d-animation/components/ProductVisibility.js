import { 
	MeshLambertMaterial,
} from 'three';

class ProductVisibility { 
    constructor(ifcManager) {
        this.ifc = ifcManager
        this.highlightMaterial = this.createMaterial(0x00dd00)
        this.isInitialTextureRemoved = false
        this.isHighlighted = false
    }

    removeTexture = (model, scene) => {
        if (!this.isInitialTextureRemoved){
            model.removeFromParent()
            this.isInitialTextureRemoved = true
        }
        console.log("REmoved Texture executred")
        console.log("Is Removed", this.isInitialTextureRemoved)
    }
    
    createMaterial(color){
        return new MeshLambertMaterial({
            transparent: true,
            opacity: 0.07,
            color: color
        });
    }

    highlightObjects(objectIDs, scene){
        this.ifc.createSubset({
            modelID: 0,
            ids: objectIDs,
            material: this.highlightMaterial,
            scene: scene,
            removePrevious: true,
            customID: 'highlightLayer',
        });
    }

    removeHighlightColor(objectIds){
        this.ifc.removeFromSubset(0, objectIds,'highlightLayer',this.highlightMaterial)
    };

    showSimulation(objectIDs, scene){
        this.ifc.createSubset({
            modelID: 0,
            ids: objectIDs,
            material: undefined,
            scene: scene,
            removePrevious: true,
            customID: 'simulationLayer',
        });
    }

    showContext(objectIDs, scene){
        this.ifc.createSubset({
            modelID: 0,
            ids: objectIDs,
            material: undefined,
            scene: scene,
            removePrevious: true,
            customID: 'context',
        });
    }

    hideHighlightObjects(modelID, ids){
        this.ifc.removeFromSubset(modelID, ids,'highlightLayer')
    }
}

export {ProductVisibility}