// Name of the selected IFC file
let currentFileName = "";

// Create HTML elements that we will use to create the menu that allows the user to open the IFC.js viewer
const logoContainer = document.createElement('div');
const logo = document.createElement('img');
const ifcjsLogo = chrome.runtime.getURL('/images/logo.png');
logoContainer.classList.add('loader-container');
logo.classList.add('landing-logo');
logo.src = ifcjsLogo;
logoContainer.appendChild(logo);

const openButton = document.createElement('button');
const openButtonLogo = document.createElement('img');
openButtonLogo.src = ifcjsLogo;
openButtonLogo.classList.add("open-button-logo");
openButton.appendChild(openButtonLogo);

// Open the IFC with the given name
function openIfcByName(name) {

    // Request the authentication token to google
    chrome.runtime.sendMessage({
        message: "get_token"
    }, response => {

        // If google gives us the token...
        if (response.message === 'success') {

            // Open the selected file
            const token = response.payload;
            openFileNamed(token, name)

        }
    });
}

function openFileNamed(token, name) {

    // Creates a new request object to get the google token
    const xhr = new XMLHttpRequest();

    // Gets the token from the Google API endpoint
    xhr.open('GET', `https://www.googleapis.com/drive/v3/files?q=fullText%20contains%20'${name}'&key=AIzaSyCFPmfIxRHgo0UtZgBannU6LwdqidxsriQ`);

    // Sets up request
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.responseType = 'json';

    // When we get the response from google...
    xhr.onload = () => {

        // Once it has the token, gets the ID of the file
        const fileID = xhr.response.files[0].id;

        // Once it has the ID of the file, give it to the background and tell it to open the BIM app
        chrome.runtime.sendMessage({message: "open_ifc_viewer", name, text: fileID});
    };

    // Send the request
    xhr.send();
}

// Functionality to show and hide the loading menu
function showLoadingGUI() {
    document.querySelector('body').appendChild(logoContainer);
}

function hideLoadingGUI() {
    document.querySelector('body').removeChild(logoContainer);
}

// When the user right clicks on the app...
window.oncontextmenu = (event) => {

    // Remove the open button, if any
    removeOpenButton();

    // If the user has clicked on an element whose HTML text contains ".ifc" (WEB SCRAPING)
    if(event.target && event.target.outerText && event.target.outerText.includes(".ifc") && !/\n/.test(event.target.outerText)){

        // Create a new open button
        currentFileName = event.target.outerText;
        createOpenButton(event.clientX, event.clientY);

    }
};

// When the user clicks on the open button...
openButton.onclick = () => {

    // Show the loading GUI for some time and open the selected IFC
    showLoadingGUI();
    setTimeout(() => openIfcByName(currentFileName), 2000);
    setTimeout(() => hideLoadingGUI(), 3000);

}

// When the user clicks anywhere, remove the open button, if any
window.onclick = () => {
    removeOpenButton();
}

// Removes the existing open button
function removeOpenButton() {
    const body = document.querySelector('body');
    if(body.contains(openButton)) {
        body.removeChild(openButton);
    }
}

// Creates a new open button
function createOpenButton(mouseX, mouseY){
    openButton.classList.add('open-file-button');
    openButton.style.left = mouseX - 80 + 'px';
    openButton.style.top = mouseY + 'px';
    document.querySelector('body').appendChild(openButton);
}