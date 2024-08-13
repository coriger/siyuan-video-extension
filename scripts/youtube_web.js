// youtube视频播放页
if(document.URL.indexOf("youtube.com/watch") > -1){
    console.log("load youtube_web js success ~  current url: " + document.URL)
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // 只匹配目标url的请求
    if(document.URL.indexOf("youtube.com/watch") > -1){

    }
})