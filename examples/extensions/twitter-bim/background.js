chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ["./styles.css"]
        })
            .then(() => {
                console.log("INJECTED THE FOREGROUND STYLES.");

                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["./foreground.js"]
                })
                    .then(() => {
                        console.log("INJECTED THE FOREGROUND SCRIPT.");
                    });
            })
            .catch(err => console.log(err));
    }
});