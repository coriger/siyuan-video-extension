// B站正片页面
if(document.URL.indexOf("bilibili.com/bangumi/play") > -1){
    console.log("load bilibili bangumi play js success ~  current url: " + document.URL)
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // 只匹配目标url的请求
    if(document.URL.indexOf("bilibili.com/bangumi/play") > -1){

    }
})