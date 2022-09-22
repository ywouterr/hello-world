class TaskProcessor { 

    constructor() {
        this.productFrames = {}
        this.products = []
        this.keyFramesTimeLine = {}
        this.startFrame = 1
    }

    purge(){
        this.productFrames = {}
        this.keyFramesTimeLine = {}
        this.products = []
        this.framerate = {}
        this.totalFrames = {}
    }

    setOptions(options){
        this.purge()
        this.setVisualisationDateRange(options.startDate, options.finishDate)
        this.setFrameRate(options.frameRate)
        this.setTotalFrames()
        this.startFrame = options.startFrame
    }

    getRemainingProducts(currentProducts) {
        const remainingProducts = this.products.filter(function(id) {
			return currentProducts.indexOf(id)<0 
		})
        return remainingProducts
    }

    getUnassignedProducts(allProducts) {
        let products = this.products
        const unassignedProducts = allProducts.filter(function(id) {
			return products.indexOf(id)<0 
		})
        return unassignedProducts
    }

    setVisualisationDateRange(animationStartDate, animationFinishDate){
        this.animationStartDate = new Date(animationStartDate)
        this.animationFinishDate = new Date(animationFinishDate)
    }

    setFrameRate(framerate){
        this.framerate = framerate
    }

    setTotalFrames(){
        this.realDuration = this.animationFinishDate.getTime() - this.animationStartDate.getTime()
        let days = this.realDuration / (1000 * 3600 * 24)
        let weeks = days / 7
        this.totalFrames = Math.round(weeks * this.framerate)
        return this.totalFrames
    }

    getTotalFrames(){
        return this.totalFrames
    }

    guessTasksDateRange(tasks){
        let lowestStartDate = new Date("01/01/2050")
        let highestFinishDate = new Date("01/01/1990")
        for (let taskId in tasks){
            let task = tasks[taskId]
            if (task.TaskTime){
                const ScheduleStart = new Date(task.TaskTime.ScheduleStart.value)
                const ScheduleFinish = new Date(task.TaskTime.ScheduleFinish.value)
                if (task.Outputs.length >1 || task.OperatesOn.length >1){
                    if (ScheduleStart < lowestStartDate){
                        lowestStartDate = ScheduleStart
                    }
                    if (ScheduleFinish > highestFinishDate){
                        highestFinishDate = ScheduleFinish
                    }
                }
            }
        }
        return {"EarliestStart":lowestStartDate.toISOString().split('T')[0], 
        "LatestStart":highestFinishDate.toISOString().split('T')[0]
        }
    }

    preprocessTasks(tasks){
        for (var taskID in tasks){
            this.preprocessTask(tasks[taskID])
        }	
        this.createKeyFrameAnimation()
    }

    preprocessTask(task){
        if (!task.TaskTime){
            return
        }
        else{
            const ScheduleStart = new Date(task.TaskTime.ScheduleStart.value)
            const ScheduleFinish = new Date(task.TaskTime.ScheduleFinish.value)
            const taskType = ((task.PredefinedType) ? task.PredefinedType  : '')
        
            let taskOutputs = task.Outputs

            let taskOperations = task.OperatesOn

            if (taskOutputs.length > 0){
                for (var i = 0; i < taskOutputs.length; i++){
                    const productID = taskOutputs[i]
                    this.addProductFrame(productID, taskType, ScheduleStart, ScheduleFinish, 'Output', task.Id)
                    if (!this.products.includes(productID)){
                        this.products.push(productID)
                    }
                }
            }

            if (taskOperations.length > 0){
                for (var i = 0; i < taskOperations.length; i++){
                    const productID = taskOperations[i]
                    this.addProductFrame(productID, taskType, ScheduleStart, ScheduleFinish, 'Operation', task.Id)
                    if (!this.products.includes(productID)){
                        this.products.push(productID)
                    }
                }
            }
            //Inputs to DO
        }
    }

    addProductFrame(productID, taskType, taskStartDate, taskFinishDate, relationship, taskId){
        if (this.productFrames[productID] == undefined){
            this.productFrames[productID] = []
        }
        let startingFrame = Math.round(this.startFrame + (((taskStartDate - this.animationStartDate) / this.realDuration) * this.totalFrames))
        let finishingFrame = Math.round(this.startFrame + (((taskFinishDate - this.animationStartDate) / this.realDuration) * this.totalFrames))
        this.productFrames[productID].push({
            "type": taskType,
            "taskID": taskId,
            "relationship": relationship,
            "STARTED": startingFrame,
            "COMPLETED": finishingFrame,
        })
    }

    getProductFrames(){
        return this.productFrames
    }

    createKeyFrameAnimation(){
        for (let i = this.startFrame; i <= this.totalFrames; i++){
            this.keyFramesTimeLine[i] = {"Show":[],"Hide":[]}
        }
        for (let id of this.products){
            let allProductFrames = this.productFrames[id]
            if (allProductFrames){
                let previousCompletionFrame = 0
                let operationFrame
                allProductFrames.forEach(productFrame => {
                    if (productFrame.relationship == 'Output'){
                        this.animateOutput(id, productFrame)
                    }
                    if (productFrame.relationship == 'Operation'){
                        this.animateOutput(id, productFrame)
                    }
                    // else if (productFrame.relationship == 'Input'){
                    // 	animateInput(id,productFrame)
                    // }
                })
                if (operationFrame){
                    animateOperation(id, operationFrame)
                }
            }
        }
        
    }

    animateOutput(objectID, productFrame){
        let consumption = ["CONSTRUCTION", "INSTALLATION", "NOTDEFINED", '']
        if (consumption.indexOf(productFrame.type)>-1)
            {
                this.animateCreation(objectID, productFrame)
            }
    }

    animateOperation(objectID, productFrame){
        let consumption = ["CONSTRUCTION", "INSTALLATION", "NOTDEFINED", '']
        if (consumption.indexOf(productFrame.type)>-1)
            {
                this.animateCreation(objectID, productFrame)
            }
    }

    animateCreation(objectID, productFrame){
        if (productFrame.STARTED < this.totalFrames && productFrame.STARTED > this.startFrame) {
            this.keyFramesTimeLine[productFrame.STARTED]["Show"].push(objectID)
        }
    }

    animateDateOutput(currentFrame, dateOutput){
        let date = this.getDateFromKeyFrame(currentFrame)
        dateOutput.innerHTML = `Current Date: ${date}`
    }
    
    extendList(list, extension){
        extension.forEach(item => {
            list.push(item)
        })
    }
    
    setCumulativeFrames(keyFramesData){
        console.log(keyFramesData)
        let previouslyShown = []
        let previouslyHidden = []
        for (let keyId in keyFramesData){
            keyFramesData[keyId]["ShowCumulative"] = []
            keyFramesData[keyId]["HideCumulative"] = []
        }

        for (let keyId in keyFramesData){
            let frame = keyFramesData[keyId]
            previouslyShown.push(...frame["Show"])
            previouslyHidden.push(...frame["Hide"])
            keyFramesData[keyId]["ShowCumulative"].push(...previouslyShown)
            keyFramesData[keyId]["HideCumulative"].push(...previouslyHidden)
        }
    }

    getKeyFramesTimeLine(){
        return this.keyFramesTimeLine
    }

    getDateFromKeyFrame(frameId){
        //WHERE 1 WEEK = 1 SECOND
        let daysPassed = frameId/this.framerate * 7
        let currentDate = new Date(this.animationStartDate.getTime() + daysPassed*24*60*60*1000)
        return currentDate.toISOString().split('T')[0]
    }
}

export {TaskProcessor}