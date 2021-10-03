window.addEventListener('keydown', () => {
    const iframe = createIframe();
    const desiredTweet = getTweetWithMessage('Everyone is prejudiced, including me')
    insert3DScene(desiredTweet, iframe);
})

function createIframe() {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.src = 'https://ifcjs.github.io/hello-world/examples/web-ifc-three/introduction/';
    iframe.width = '100%';
    iframe.height = '300px';
    iframe.classList.add('ifcjs-iframe');
    return iframe;
}

function getTweetWithMessage(searchText) {
    const filter = new RegExp(searchText);
    const tweets = Array.from(document.getElementsByTagName("span"));
    return tweets.find(tweet => filter.test(tweet.textContent));
}

function insert3DScene(element, iframe) {
    const parent = element.parentNode;
    const grandparent = parent.parentNode;
    grandparent.style.minHeight = '20rem';
    grandparent.removeChild(parent);
    grandparent.appendChild(iframe);
}

