// 外部视频播放tab页  始终锁定这个页面
var tabId = "";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // 查询当前iframe视频进度的指令  
    if (request.action === "queryInnerIframe") {
        console.log("queryInnerIframe:"+request.frameUrl);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // 发送消息到iframe中的content脚本
            chrome.tabs.sendMessage(tabs[0].id, {action: "queryIframeVideo",frameUrl:request.frameUrl},function(response){
                // 返回当前时间戳
                sendResponse({currentTime:parseStrFromTime(response.time)}); // 发送
            });
        });
        return true; // 保持消息通道打开以响应异步请求
    }

    // 查询外部视频进度的指令  
    if (request.action === "queryOuterVideo") {
        chrome.tabs.query({}, function(tabs) {
            // 遍历tabs 
            for (var i = 0; i < tabs.length; i++) {
                // 判断url是否存在 
                if (tabs[i].url == request.videoUrl){
                    console.log("找到tab");
                    // 假设你已经有了tabs数组，并且知道要切换到的标签页的索引i
                    // 首先，使用chrome.windows.update将目标窗口置于最前面（如果它不在最前面的话）
                    chrome.windows.update(tabs[i].windowId, {focused: true}, function() {
                        // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                        chrome.tabs.update(tabs[i].id, {active: true}, function() {
                            // 发送消息到content中  进行查询时间戳操作
                            chrome.tabs.sendMessage(tabs[i].id, {action: "queryOuterVideo","videoUrl":request.videoUrl},function(response){
                                // 返回当前时间戳
                                sendResponse({currentTime:parseStrFromTime(response.time)}); // 发送
                            });
                        });
                    });
                    return;
                }
            }
            console.log("没有找到tab");
        });
        return true; // 保持消息通道打开以响应异步请求
    }

    // 跳转内嵌iframe视频指令
    if (request.action === "dumpInnerVideo") {
        var timeInSeconds = parseTimeFromStr(request.time);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // 遍历tabs
            // 发送消息到iframe中的content脚本
            chrome.tabs.sendMessage(tabs[0].id, {action: "dumpFrameVideo",time:timeInSeconds,frameUrl:request.frameUrl});
        });
        return true; // 保持消息通道打开以响应异步请求
    }

    // 跳转外部视频指令
    if (request.action === "dumpOuterVideo") {
        var timeInSeconds = parseTimeFromStr(request.time);
        chrome.tabs.query({}, function(tabs) {
            // 遍历tabs 
            for (var i = 0; i < tabs.length; i++) {
                // 判断url是否存在 
                if (tabs[i].url == request.videoUrl){
                    console.log("已存在tab："+request.videoUrl);
                    // 假设你已经有了tabs数组，并且知道要切换到的标签页的索引i
                    // 首先，使用chrome.windows.update将目标窗口置于最前面（如果它不在最前面的话）
                    chrome.windows.update(tabs[i].windowId, {focused: true}, function() {
                        // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                        chrome.tabs.update(tabs[i].id, {active: true}, function() {
                            // 发送消息到content中  进行跳转操作
                            chrome.tabs.sendMessage(tabs[i].id, {action: "dumpOuterVideo",time:timeInSeconds,"videoUrl":request.videoUrl});
                        });
                    });
                    return;
                }
            }

            // 先判断一下有没有tabId  
            if(tabId && tabId != ""){
                // 有的话再判断下tabId对应的tab是否还存在
                chrome.tabs.get(tabId,function(tab){
                    if(!tab){
                        tabId = "";
                        // 不存在 则创建
                        chrome.tabs.create({url: request.videoUrl}, function(tab) {
                            tabId = tab.id;
                            chrome.windows.update(tab.windowId, {focused: true}, function() {
                                    // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                                    chrome.tabs.update(tab.id, {active: true}, function() {});
                            });
                        });
                    }else{
                        // tab还存在，则直接在该tab上打开新链接，并且切换为活动页
                        chrome.tabs.update(tabId, {url: request.videoUrl}, function() {
                            chrome.windows.update(tabId, {focused: true}, function() {
                                // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                                chrome.tabs.update(tabId, {active: true}, function() {
                                });
                            });
                        });
                    }
                })
            }else{
                // 不存在 则创建
                chrome.tabs.create({url: request.videoUrl}, function(tab) {
                    tabId = tab.id;
                    chrome.windows.update(tab.windowId, {focused: true}, function() {
                            // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                            chrome.tabs.update(tab.id, {active: true}, function() {});
                    });
                });
            }
        });
        return true; // 保持消息通道打开以响应异步请求
    }    

    // 定位视频详情页窗口
    if (request.action === "openOuterVideo") {
        console.log("openOuterVideo : " + request.videoUrl);
        chrome.tabs.query({}, function(tabs) {
            // 遍历tabs 
            for (var i = 0; i < tabs.length; i++) {
                // 判断url是否存在 
                if (tabs[i].url == request.videoUrl){
                    console.log("已存在tab");
                    // 假设你已经有了tabs数组，并且知道要切换到的标签页的索引i
                    // 首先，使用chrome.windows.update将目标窗口置于最前面（如果它不在最前面的话）
                    chrome.windows.update(tabs[i].windowId, {focused: true}, function() {
                        // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                        chrome.tabs.update(tabs[i].id, {active: true}, function() {
                            // 如果需要，可以在这里添加成功切换到标签页后的处理逻辑
                        });
                    });
                    return;
                }
            }


            // 先判断一下有没有tabId  
            if(tabId && tabId != ""){
                // 有的话再判断下tabId对应的tab是否还存在
                chrome.tabs.get(tabId,function(tab){
                    if(!tab){
                        tabId = "";
                        // 不存在 则创建
                        chrome.tabs.create({url: request.videoUrl}, function(tab) {
                            tabId = tab.id;
                            chrome.windows.update(tab.windowId, {focused: true}, function() {
                                    // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                                    chrome.tabs.update(tab.id, {active: true}, function() {});
                            });
                        });
                    }else{
                        // tab还存在，则直接在该tab上打开新链接，并且切换为活动页
                        chrome.tabs.update(tabId, {url: request.videoUrl}, function() {
                            chrome.windows.update(tabId, {focused: true}, function() {
                                // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                                chrome.tabs.update(tabId, {active: true}, function() {
                                });
                            });
                        });
                    }
                })
            }else{
                // 不存在 则创建
                chrome.tabs.create({url: request.videoUrl}, function(tab) {
                    tabId = tab.id;
                    chrome.windows.update(tab.windowId, {focused: true}, function() {
                            // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                            chrome.tabs.update(tab.id, {active: true}, function() {});
                    });
                });
            }
        });
        return true; // 保持消息通道打开以响应异步请求
    }

    // iframe截图指令
    if (request.action === "screenshot") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // 遍历tabs
            // 发送消息到iframe中的content脚本
            chrome.tabs.sendMessage(tabs[0].id, {action: "screenIframe",frameUrl:request.frameUrl});
        });
        return true; // 保持消息通道打开以响应异步请求
    }

    // 外部视频截图指令
    if (request.action === "screenshotOuterVideo") {
        chrome.tabs.query({}, function(tabs) {
            // 遍历tabs 
            for (var i = 0; i < tabs.length; i++) {
                // 判断url是否存在 
                if (tabs[i].url == request.videoUrl){
                    console.log("已找到tab:"+request.action+" "+request.videoUrl);
                    // 假设你已经有了tabs数组，并且知道要切换到的标签页的索引i
                    // 首先，使用chrome.windows.update将目标窗口置于最前面（如果它不在最前面的话）
                    chrome.windows.update(tabs[i].windowId, {focused: true}, function() {
                        // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                        chrome.tabs.update(tabs[i].id, {active: true}, function() {
                            chrome.tabs.sendMessage(tabs[i].id, {action: "screenshotOuterVideo",videoUrl:request.videoUrl});
                        });
                    });
                    return;
                }
            }
        });
        return true; // 保持消息通道打开以响应异步请求
    }

    // iframe内嵌写入截图指令
    if (request.action === "screenInsert") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // 遍历tabs
            // 发送消息到iframe中的content脚本
            chrome.tabs.sendMessage(tabs[0].id, {action: "screenInsert",imgUrl: request.imgUrl,currentTime:request.currentTime});
        });
        return true; // 保持消息通道打开以响应异步请求
    }

    // 外部视频写入截图指令
    if (request.action === "screenOuterInsert") {
        console.log("screenOuterInsert : " + request.imgUrl + " " + request.currentTime);
        chrome.tabs.query({}, function(tabs) {
            // 遍历tabs 
            for (var i = 0; i < tabs.length; i++) {
                // 判断url是否存在 
                if (tabs[i].url == request.videoUrl){
                    console.log("已找到tab");
                    // 假设你已经有了tabs数组，并且知道要切换到的标签页的索引i
                    // 首先，使用chrome.windows.update将目标窗口置于最前面（如果它不在最前面的话）
                    chrome.windows.update(tabs[i].windowId, {focused: true}, function() {
                        // 然后，使用chrome.tabs.update将目标标签页设置为活动标签页
                        chrome.tabs.update(tabs[i].id, {active: true}, function() {
                            // 发送给所有content脚本的页面
                            for (var j = 0; j < tabs.length; j++) {
                                chrome.tabs.sendMessage(tabs[j].id, {action: "screenOuterInsert",imgUrl: request.imgUrl,currentTime:request.currentTime});

                            }
                        });
                    });
                    return;
                }
            }
        });
        return true; // 保持消息通道打开以响应异步请求
    }

});


/**
 * 针对百度网盘接口的监听  
 * 无法拦截  只是二次请求
 */
chrome.webRequest.onCompleted.addListener(function (details) {
    // 针对https://pan.baidu.com/api/list的接口监听
    // 注入下载按钮
    if (details.url.indexOf("pan.baidu.com/api/list") > -1 && details.url.indexOf("sysy") == -1){
        // 这里直接发起请求
        fetch(details.url+"&sysy=1")
        .then(response => {
            // 确保响应是成功的（状态码在200-299之间）
            if (!response.ok) {
                console.log("response is not ok "+response.ok);
                throw new Error('Network response was not ok: ' + response.status);
            }
            // 解析响应体为文本
            return response.text();
        })
        .then(async result => {
            // 打印返回的文本内容
            var json = JSON.parse(result);
            console.log(json)
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                // 遍历tabs
                // 发送消息到iframe中的content脚本
                chrome.tabs.sendMessage(tabs[0].id, {action: "injectBaiduPanButton",data:json});
            });
        })
        .catch(error => {
            // 捕获并打印任何错误
            console.error('There has been a problem with your fetch operation:', error);
        });
    }

}, {urls: ["https://pan.baidu.com/*"]});



/**
 * 针对bilibili.com接口的监听  
 * 无法拦截  只是二次请求
 */
chrome.webRequest.onCompleted.addListener(function (details) {
    // 针对api.bilibili.com/pgc/view/web/ep/list的接口监听
    // 监听到了之后发送消息给content.js  只有当前页是bangumi/play才处理这个消息
    // 注入下载正片按钮
    if (details.url.indexOf("api.bilibili.com/pgc/view/web/ep/list") > -1 && details.url.indexOf("sysy") == -1){
        // 这里直接发起请求
        fetch(details.url+"&sysy=1")
        .then(response => {
            // 确保响应是成功的（状态码在200-299之间）
            if (!response.ok) {
                console.log("response is not ok "+response.ok);
                throw new Error('Network response was not ok: ' + response.status);
            }
            // 解析响应体为文本
            return response.text();
        })
        .then(async result => {
            // 打印返回的文本内容
            var json = JSON.parse(result);
            console.log(json)
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                // 遍历tabs
                // 发送消息到iframe中的content脚本
                chrome.tabs.sendMessage(tabs[0].id, {action: "injectBilibiliZhengPianButton",data:json});
            });
        })
        .catch(error => {
            // 捕获并打印任何错误
            console.error('There has been a problem with your fetch operation:', error);
        });
    }


    // 针对合集接口的监听
    if (details.url.indexOf("api.bilibili.com/x/web-interface/wbi/view/detail") > -1 && details.url.indexOf("sysy") == -1){
        // 这里直接发起请求
        fetch(details.url+"&sysy=1")
        .then(response => {
            // 确保响应是成功的（状态码在200-299之间）
            if (!response.ok) {
                console.log("response is not ok "+response.ok);
                throw new Error('Network response was not ok: ' + response.status);
            }
            // 解析响应体为文本
            return response.text();
        })
        .then(async result => {
            // 打印返回的文本内容
            var json = JSON.parse(result);
            console.log(json)
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                // 遍历tabs
                // 发送消息到iframe中的content脚本
                chrome.tabs.sendMessage(tabs[0].id, {action: "injectBilibiliHeJiButton",data:json});
            });
        })
        .catch(error => {
            // 捕获并打印任何错误
            console.error('There has been a problem with your fetch operation:', error);
        });
    }

}, {urls: ["*://*.bilibili.com/*"]});

/**
 * 时间戳字符串转换成秒数
 * @param {*} timeStr 
 * @returns 
 */
function parseTimeFromStr(timeStr){
    var timeInSeconds = "";
    if (timeStr && timeStr != '') {
        // 这里判断下timeInSeconds的格式  如果是包含:的字符串，则转换为秒数
        if (timeStr.indexOf(':') > -1) {
            // 格式为xx:yy:zz，则转换为秒数
            var time = timeStr.split(':');
            // 如果是xx:yy则表示分钟:秒
            // 如果是xx:yy:zz则表示小时:分钟:秒
            if (time.length == 2) {
                timeInSeconds = parseInt(time[0]) * 60 + parseInt(time[1]);
            } else if (time.length == 3) {
                timeInSeconds = parseInt(time[0]) * 60 * 60 + parseInt(time[1]) * 60 + parseInt(time[2]);
            }
        }else{
            timeInSeconds = parseInt(timeInSeconds);
        }
    }

    return timeInSeconds;
}

/**
 * 把秒数转换成时间戳字符串
 * @param {*} currentTime 
 * @returns 
 */
function parseStrFromTime(currentTime){
    var time = "00:00";
    if (currentTime && currentTime !== "") {
        // 这里currentTime单位是秒，把它转换一下，小于60秒则直接显示秒，大于60秒则显示分钟:秒，大于60分钟，则显示小时:分钟:秒，且每个单位如果是个位数则前面补0
        // 时间戳1分钟以内 直接用秒表示
        if(currentTime < 10) {
            // 小于10s  按00:0x
            // 所有的秒只保留整数部分，即小数点后不显示
            time = "00:0"+ parseInt(currentTime).toString();
        }else if(currentTime < 60){
            // 小于1分钟 按00:xx
            time = "00:"+ parseInt(currentTime).toString();
        }else if(currentTime < 60 * 60) {
            // 小于1小时  按xx:yy
            var min = parseInt(currentTime/60);
            if(min < 10) {
                time = "0"+min.toString()+":";
            } else {
                time = min.toString()+":";
            }
            var sec = currentTime%60;
            if(sec < 10) {
                time += "0"+parseInt(sec).toString();
            } else {
                time += parseInt(sec).toString();
            }
         }else {
            var hour = parseInt(currentTime/3600);
            if(hour < 10) {
                time = "0"+hour.toString()+":";
            } else {
                time = hour.toString()+":";
            }
            var min = parseInt((currentTime%3600)/60);
            if(min < 10) {
                time += "0"+min.toString()+":";
            } else {
                time += min.toString()+":";
            }
            var sec = currentTime%60;
            if(sec < 10) {
                time += "0"+parseInt(sec).toString();
            } else {
                time += parseInt(sec).toString();
            }
         }
    }

    return time;
}