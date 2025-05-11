function getArticleText(){
    const article = document.querySelector('article');
    if (article) {
        return article.innerText;
    } 

    const paragraphs = Array.from(document.querySelectorAll('p'));
    if(paragraphs.length > 0)
        return paragraphs.map((p) => p.innerText).join('\n');
    // Fallback to the entire body text if no article or paragraphs are found
    const main = document.querySelector('main');
    if (main) {
        return main.innerText;
    }
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
    if((req.type == "GET_ARTICLE_TEXT")){
        const text = getArticleText();
        sendResponse({ text })
    }
})