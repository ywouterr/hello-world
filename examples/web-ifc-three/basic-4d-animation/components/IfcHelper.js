class IfcHelper { 

    constructor() {
    }

    async getSchedules(ifcManager, modelID){
        let schedules = await ifcManager.byType(modelID, "IfcWorkSchedule")
        let scheduleProps = []
        schedules.forEach(schedule => {
            scheduleProps.push({"Id":schedule.expressID, "Name":schedule.Name.value})
        })
        return scheduleProps
    }

    async loadScheduleTasks(ifcManager, modelID, scheduleID){
        const getRootTasks = async (modelID, workScheduleID) => {
            let controls = await ifcManager.byType(modelID, "IfcRelAssignsToControl")
            let rootTaskIds = []
            for (let i = 0; i < controls.length; i++) {
                let control = controls[i]
                if (control.RelatingControl.value == workScheduleID ){
                    for (let i = 0; i < control.RelatedObjects.length; i++) {
                        let relatedObjectId = control.RelatedObjects[i].value
                        let relatedObject = await ifcManager.byId(modelID, relatedObjectId)
                        if (await ifcManager.isA(relatedObject, "IfcTask")){
                            console.log(relatedObject)
                            rootTaskIds.push(relatedObjectId)
                        }
                    }
              }
            }
            return rootTaskIds
        }

        const getChildrenTasks = (TaskID) => {
            let task = ifcManager.sequenceData.tasks[TaskID]
            let children = task.IsNestedBy
            scheduleTasks[TaskID] = task
            if (children){
                children.forEach(child => {
                    getChildrenTasks(child)
                })
            }
        }
        
        const scheduleTasks = {}
        let rootTasks = await getRootTasks(modelID, scheduleID)
        rootTasks.forEach(rootTask => {
            getChildrenTasks(rootTask)
        })
        console.log(scheduleTasks)
        return scheduleTasks
    }
}

export {IfcHelper}