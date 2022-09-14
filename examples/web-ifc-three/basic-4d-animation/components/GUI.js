class GUI { 
    constructor() {
        this.isScheduleCreatorLoaded = false
        this.animationGUILoaded = false
    }

    setDates = (start, finish) => {
        this.setDate('userStartDate', start)
        this.setDate('userFinishDate', finish)
    }

    setDate(componentId, date){
        if (document.getElementById(componentId)){
        document.getElementById(componentId).value = date
        }
    }

    getSelectedSchedule(){
        return Number(document.getElementById('scheduleDropdown').selectedOptions[0].id)
    }

    createScheduleSelector(schedules){
        if (!this.isScheduleCreatorLoaded){
            let animationOptions = this.createDomElement('div','animationOptions','animationOptions','',document.body)
            let rowSchedules = this.createDomElement('div', 'rowSchedules', 'row', '', animationOptions)
            this.createDomElement('label','chooseSchedules','label','span', rowSchedules).innerHTML = "Choose a Schedule";
            let dropDown = this.createDomElement('select', 'scheduleDropdown', 'animationType', '', rowSchedules)
            schedules.forEach(schedule => {
                this.createDomElement('option', String(schedule.Id),'animationType','',dropDown).innerHTML = schedule.Name
            });
            this.createButton('loadScheduleTasks','Load Tasks',rowSchedules)
            console.log("Created WorkSChedules Items")
            this.isScheduleCreatorLoaded = true
        }
    }
    
    getAnimationType(){
        return this.getDomValue('animationType')
    }

    createAnimationGUI(){
        if (!this.animationGUILoaded){
            let animationOptions = document.getElementById('animationOptions') 
            let row1 = this.createDomElement('div','row1','row','',animationOptions)
            let row2 = this.createDomElement('div','row2','row','',animationOptions)
            let row3 = this.createDomElement('div','row3','row','',animationOptions)
            this.createDomElement('div','fourDControls','fourDControls','',animationOptions)
            // this.createDomElement('label','userStartDateLabel','label','', row2).innerHTML = 'From:'
            this.createDomElement('input','userStartDate','userStartDate','date', row1)
            this.createDomElement('label','userFinishDateLabel','label','span', row1).innerHTML = "&#8594";
            this.createDomElement('input','userFinishDate','userFinishDate','date', row1)
            this.createButton('getDateRange', 'Guess Dates',row1);
            this.createDomElement('label','animationTypeLabel','animationTypeLabel','',row2).innerHTML = 'Animation Type:'
            let animationDropDown = this.createDomElement('select','animationType','animationType','',row2)
            this.createDomElement('option','Cumulative','Cumulative','',animationDropDown).innerHTML = 'Cumulative'
            this.createDomElement('option','Cumulative','Cumulative','',animationDropDown).innerHTML = 'Isolated Tasks'
            this.createDomElement('label','frameRateLabel','frameRateLabel','',row3).innerHTML = 'Frame Per Second'
            this.createDomElement('input','userFrameRate','userFrameRate','number', row3).value = "60"
            this.createButton('startAnimationButton','Start Animation',row3)
            let sliderContainer = this.createDomElement('div','sliderContainer','sliderContainer','', document.body)
            this.slider = this.createDomElement('input','SigmaSlider','slider','range', sliderContainer)
            this.animationGUILoaded = true
            }
    }

    setupKeyFrameTimeline = (settings, totalFrames) => {        
        this.setSliderValues(settings, totalFrames)
        this.getSliderContainer().appendChild(this.slider)
        // this.createKeyFrameViz(totalFrames)
        this.showDomElement(this.slider)
        // this.updateBarSize()
    }

    setSliderValues = (settings, totalFrames) => {
        this.totalFrames = totalFrames
        this.frameRate = settings.frameRate
        this.slider.value = settings.startFrame;
        this.slider.min = settings.startFrame;
        this.slider.max = totalFrames;
        
    }

    createKeyFrameViz = (totalFrames) => {
        this.setUpRulerDimensions()
        const myUl = document.createElement('ul');
        myUl.classList.add('ruler-x')
        let intervals = (totalFrames/this.frameRate )
        console.log("Intervals", intervals)

        for (let i = 0; i < intervals ; i++){
            const li = document.createElement("li")
            myUl.appendChild(li)
            li.innerHTML = String((i+1)*this.frameRate)
        }
        this.getSliderContainer().appendChild(myUl)
    }

    setUpRulerDimensions = () => {
        let rate = this.getFrameRate()
        let unit = (Number(window.innerWidth))/(Number(this.slider.max))
        document.body.style.setProperty("--rulerSpacing",rate)
        document.body.style.setProperty("--rulerUnit",String(unit) + "px")
    }

    updateBarSize = () => {
        window.addEventListener('resize', () => {
            this.setUpRulerDimensions()
            console.log("sizing")
        });
    }

    createDateOutput = () => {
        let sequenceTools = this.createDomElement('div','sequenceTools','sequenceTools','',document.body)
        let dateResults = this.createDomElement('div','displayResults','displayResults','',sequenceTools)
        this.createDomElement('p','dateOutput','dateOutput','',dateResults)
    }

    getAnimationSlider(){
        return document.getElementById('SigmaSlider')
    }

    getDateOutput(){
        return document.getElementById('dateOutput')
    }

    getSliderContainer(){
        return document.getElementById('sliderContainer')
    }

    getDates(){
        return {"start":document.getElementById('userStartDate').value, "finish":document.getElementById('userFinishDate').value}
    }

    getFrameRate(){
        return Number(this.getDomValue('userFrameRate'))
    }

    getControlsDiv(){
        return document.getElementById('fourDControls')
    }

    getAnimationOptions(){
        return document.getElementById('animationOptions')
    }

    getDateResultsDiv(){
        return document.getElementById('displayResults')
    }

    getGuessDatesButton(){
        return document.getElementById('getDateRange')
    }

    getStartAnimationButton(){
        return document.getElementById('startAnimationButton')
    }

    createDomElement = (component, id, classList, type, parentDiv) => {
        let div = document.createElement(component)
        div.id = id
        div.classList.add(classList)
        if(parentDiv){
            parentDiv.appendChild(div)
        }
        if(type){
            div.type = type
        }
        return div
    }

    createButton = (id, name, parentDiv) => {
        let button = document.createElement('button');
        button.id = id;
        button.innerHTML = name;
        button.classList.add('button-6');
        if(parentDiv){
            parentDiv.appendChild(button)
        }
        return button
    }

    hideDomElement = (element) => {
        element.style.display = 'none'
    }

    showDomElement = (element) => {
        element.style.display = 'block'
    }

    hasUserDates  = () => {
        if (this.getDomValue('userStartDate') && this.getDomValue('userFinishDate')){
            return true
        }
        else{
            return false
        }
    }
    
    getDomValue = selectionDivId => (document.getElementById(selectionDivId)?  document.getElementById(selectionDivId).value : "none")

    setSliderControls(slider, animationType, keyFramesData, productVisibility){
        if (animationType == 'Cumulative'){
            setCumulativeAnimation(slider, keyFramesData, productVisibility)
        }
        else if (animationType == 'Isolated Tasks'){
            setIsolatedTaskAnimation(slider, keyFramesData, productVisibility) // Set Automatic Slider
        }
    }
}

export {GUI}