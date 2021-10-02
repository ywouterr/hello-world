//When the app loads, inject the necessary content (this is the same in all apps)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        chrome.scripting.insertCSS({
            target: {tabId: tabId},
            files: ["./styles.css"]
        })
            .then(() => {
                console.log("INJECTED THE FOREGROUND STYLES.");

                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ["./foreground.js"]
                })
                    .then(() => {
                        console.log("INJECTED THE FOREGROUND SCRIPT.");
                    });
            })
            .catch(err => console.log(err));
    }
});

// When the foreground sends a message, receive it and...
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // If the foreground wants the token...
    if (request.message === 'get_token') {

        // Get it with google drive API
        chrome.identity.getAuthToken({interactive: true}, function (token) {
            console.log("Token: ", token);

            // Send the token back to the foreground
            sendResponse({
                message: 'success',
                payload: token
            });
        });
        return true;

        // If the foreground wants to open the online viewer...
    } else if (request.message === 'open_ifc_viewer') {

        // Open the viewer in a new tab, passing the id and the name as URL parameters
        const url = `http://localhost:5000/examples/web-ifc-viewer/google-drive-viewer/?id=${request.text}&name=${request.name}`
        chrome.tabs.create({ url });
        return true;
    }
});