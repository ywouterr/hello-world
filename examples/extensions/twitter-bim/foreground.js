

// TWITTER
const searchText = /Everyone is prejudiced, including me. For example, if you talk to me about how your BIM processes implement Big data or AI, I'm not likely to take you very seriously anymore./;

window.addEventListener('keydown', () => {

     const meta = document.createElement('meta');
     meta.httpEquiv = 'Cache-control';
     meta.content = 'no-cache';
     document.head.appendChild(meta);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.src = 'https://ifcjs.github.io/hello-world/examples/web-ifc-three/test/';
    iframe.width = '100%';
    iframe.height = '300px';
    iframe.classList.add('ifcjs-iframe');

    const aTags = document.getElementsByTagName("span");
    for (let i = 0; i < aTags.length; i++) {
        if (searchText.test(aTags[i].textContent)) {
            console.log(aTags[i])
            // found = aTags[i];
            insert3DScene(aTags[i], iframe);
            break;
        }
    }
})

function insert3DScene(element, iframe) {
    const parent = element.parentNode;
    const grandparent = parent.parentNode;
    grandparent.style.minHeight = '20rem';
    grandparent.removeChild(parent);
    grandparent.appendChild(iframe);
}

chrome.runtime.sendMessage({
    message: "get_name"
}, response => {
    if (response.message === 'success') {
        // ce_name.innerHTML = `Hello ${response.payload}`;
    }
});

// ce_button.addEventListener('click', () => {
    // chrome.runtime.sendMessage({
    //     message: "change_name",
    //     payload: ce_input.value
    // }, response => {
    //     if (response.message === 'success') {
    //         ce_name.innerHTML = `Hello ${ce_input.value}`;
    //     }
    // });
// });
