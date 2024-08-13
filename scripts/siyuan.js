// 思源笔记
if(document.URL.indexOf("/stage/build/desktop") > -1){
    console.log("load siyuan js success ~  current url: " + document.URL)
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // 只匹配目标url的请求
    if(document.URL.indexOf("/stage/build/desktop") > -1){
        

    }
})