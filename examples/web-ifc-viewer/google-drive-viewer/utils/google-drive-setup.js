// SOURCE: https://developers.google.com/drive/api/v3/quickstart/js

// Client ID and API key from the Developer Console
// Beware: I have my own API keys. If you want to access to your google drive projects, click on the link above and
// follow the guide to get yours. Then, simply copy the values here.
let CLIENT_ID = '';
let API_KEY = '';

async function getCredentials() {
    // For local only; to have this online, we need a backend that manages the keys as secrets
    const file = await fetch('keys.json');
    if (!file.ok) throw new Error('Credentials not found! Have you created your own credentials?');
    const json = await file.json();
    if (typeof json !== 'object') throw new Error('Credentials could not be parsed');
    CLIENT_ID = json.CLIENT_ID;
    API_KEY = json.API_KEY;
}

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive';

// Get html elements
const authorizeButton = document.getElementById('authorize_button');
const buttonText = document.getElementById('authorize_button-text');
const fileName = document.getElementById('file-name');

/**
 *  On load, called to load the auth2 library and API client library.
 */
async function handleClientLoad() {
    await getCredentials();
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    const result = authenticateUser();
    result.then(setupAuthEvents, logAuthErrors);
}

function authenticateUser() {
    return gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    });
}

function setupAuthEvents() {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
}

function logAuthErrors(error) {
    console.log(JSON.stringify(error, null, 2));
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        const {id, name} = getIdAndName();
        fileName.innerText = `Name: ${name}`;
        if (id) downloadFile(id);
        else console.log('No ID was providen as URL parameter!');
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    authorizeButton.onclick = handleSignoutClick;
    buttonText.innerText = 'Sign out';
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    authorizeButton.onclick = handleAuthClick;
    buttonText.innerText = 'Sign in';
    gapi.auth2.getAuthInstance().signOut();
}

function downloadFile(fileId) {
    gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    }).then(function (response) {
        loadIfcModel(response.body);
    }, function (error) {
        console.error(error)
    })
}

function getIdAndName() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const name = urlParams.get("name");
    return {id, name};
}

function loadIfcModel(text) {
    const blob = new Blob([text], {type: 'text/plain'});
    const file = new File([blob], "ifcModel");
    window.webIfcAPI.IFC.loadIfc(file);
}