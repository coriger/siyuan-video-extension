$(function(){
        // 获取当前tab页面的url  根据不同域名进行不同的注入处理
        currentPageUrl = document.location.href;
        console.log("currentPageUrl is " + currentPageUrl);

        if(currentPageUrl.indexOf('/stage/build/desktop') != -1){
            // 思源页面  注入时间戳按钮
            injectVideoJumpButton()
        }else if(currentPageUrl.indexOf('bilibili.com/video') != -1){
            // bilibili 列表 &&单视频   合集需要单独劫持
            injectBilibiliVideoDownButton()
        }else if(currentPageUrl.indexOf('youtube.com/watch') != -1){
            // 单页面下载按钮
            injectYoutubeVideoDownButton()
        }else if(currentPageUrl.indexOf('youtube.com/playlist') != -1){
            // 列表页面下载按钮
            injectYoutubePlaylistDownButton()
        }
        
        // 监听点击事件  这里主要是处理思源页面中的时间戳标签点击事件
        document.body.addEventListener('click', function(event) {
            var target = event.target;
            if (target.tagName.toLowerCase() === 'span') {
                var href = target.getAttribute('data-href');
                if(href == '##'){
                    // iframe内嵌模式
                    // 内部跳转
                    var time = target.innerText;
                    // 去除[]
                    time = time.replace(/\[|\]/g, '');
                    // 这里可以同时固定住当前页面的视频
                    document.querySelectorAll(".fn__flex-1.protyle").forEach(function (node) {
                        // 获取class属性值
                        var className = node.getAttribute("class")
                        if(className == 'fn__flex-1 protyle'){
                            // 判断当前文档树是否展开 如果展开 点击关闭
                            // dock__item ariaLabel dock__item--active
                            var menuNode = document.querySelector(".dock__item.ariaLabel.dock__item--active");
                            if(menuNode){
                                // 如果是大纲  就不执行关闭
                                var dataTitle = menuNode.getAttribute("data-title");
                                if(dataTitle && dataTitle == "大纲"){
                                    console.log("大纲模式,不处理");
                                }else{
                                    menuNode.click();
                                }
                            }

                            // 每次点击时间戳 都要把当前页面iframe固定住
                            node.querySelectorAll(".iframe-content")[0].style.position = "fixed";
                            // 移除iframe的宽度width
                            node.querySelectorAll("iframe")[0].style.removeProperty("width");

                            var frameUrl = node.querySelectorAll("iframe")[0].getAttribute("src")
                            // 跳转当前内嵌页面视频进度
                            dumpInnerVideo(time, frameUrl);
                        }
                    })
                }else if(href == '###'){
                    // 左右分屏模式  这种更通用
                    var hrefText = target.innerText;
                    // 判断文本类型   http链接 还是 时间戳
                    if(hrefText && hrefText.indexOf('http') != -1){
                        // 跳转页面  先定位tab  没有则创建  这种一般是首次打开 没有时间戳笔记的时候快速定位视频页面
                        openOuterVideo(hrefText);
                    }else if(hrefText && hrefText.indexOf(':') != -1){
                        // 时间戳
                        var time = hrefText.replace(/\[|\]/g, '');
                        var videoUrl = target.getAttribute('data-title');
                        if(videoUrl && videoUrl !=""){
                            // 跳转外部页面视频进度 
                            dumpOuterVideo(time, videoUrl);
                        }
                    }
                }
            }
        }, true); // 使用捕获模式来确保在所有其他事件监听器之前执行

        // 跨域通信  监听来自background的消息
        chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
            console.log("onMessage request action is " + request.action);
            console.log("onMessage current page is " + currentPageUrl);
            
            // 外部视频跳转
            if (request.action === "dumpOuterVideo") {
                // 这里还需要判断一下视频详情页地址是否和当前页面匹配
                if(document.URL == request.videoUrl){
                    document.querySelector('video').currentTime = request.time;
                    document.querySelector('video').play();
                    sendResponse({result: "ok"})
                    return true; // 保持消息通道打开直到sendResponse被调用
                }else{
                    // 其他页面收到消息后暂停视频
                    var video = document.querySelector('video');
                    if(video){
                        video.pause();
                    }
                    return false;
                }
            }

            // youtube  iframe视频跳转
            if (request.action === "dumpFrameVideo" && currentPageUrl.indexOf('youtube.com/embed') != -1) {
                if(document.URL == request.frameUrl){
                    document.querySelector('video').currentTime = request.time;
                    document.querySelector('video').play();
                    // 可以发送响应消息
                    sendResponse({result: "ok"});
                    return true; // 保持消息通道打开直到sendResponse被调用
                }else{
                    document.querySelector('video').pause();
                    return false;
                }
            }

            // 查询外部视频进度条
            if (request.action === "queryOuterVideo") {
                // 判断当前页面的iframe地址是否和request.frameUrl相同
                if(document.URL == request.videoUrl){
                    sendResponse({time: document.querySelector('video').currentTime})
                    document.querySelector('video').play();
                    return true; // 保持消息通道打开直到sendResponse被调用
                }
            }

            // 外部视频写入截图
            if (request.action === "screenOuterInsert" && currentPageUrl.indexOf('/stage/build/desktop') != -1) {
                        // 拿到数据直接写入思源
                        var currentTime = request.currentTime;
                        var imgUrl = request.imgUrl;
                        // 把截图和时间戳插入到思源中
                        
                        console.log(currentTime);
                        console.log(imgUrl);
                        const videoTimestamp = document.createElement('div');
                        
                        // 获取当前窗口下的datanode
                        document.querySelectorAll(".fn__flex-1.protyle").forEach(async function (node) {
                            // 获取class属性值
                            var className = node.getAttribute("class")
                            if(className == 'fn__flex-1 protyle'){
                                    // 外部视频写入
                                    var videoUrl = node.querySelector("span[data-href='###']").innerText;
                                    if(videoUrl){
                                        videoTimestamp.innerHTML = `#### <span data-type="a" data-href="###" data-title="${videoUrl}">[${currentTime}]</span>：`;
                                        // 从当前节点里找.sb
                                        var nodeId = node.querySelector(".protyle-breadcrumb__item.protyle-breadcrumb__item--active").getAttribute("data-node-id");
                                        // 这里调用一下思源插入内容快的接口
                                        var result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                            "data": videoTimestamp.innerHTML,
                                            "dataType": "markdown",
                                            "parentID": nodeId
                                        });
                                        result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                            "data": `>`,
                                            "dataType": "markdown",
                                            "parentID": nodeId
                                        });
                                        // 这里移动焦点到最新插入的节点
                                        console.log("result is => "+result.data[0].doOperations[0].id)
                                        var newNode = document.querySelector(`[data-node-id="${result.data[0].doOperations[0].id}"]`)
                                        if (newNode) {
                                            node.querySelector(".protyle-content.protyle-content--transition").scrollTop += 1000;
                                            newNode.setAttribute('tabindex', '0');
                                            newNode.focus();
                                        }
                                        // 插入图片  
                                        result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                            "data": `>​![image](${imgUrl})`,
                                            "dataType": "markdown",
                                            "parentID": nodeId
                                        });
                                    }
                            }
                        })
                        sendResponse({result: "ok"})
                        return true; // 保持消息通道打开直到sendResponse被调用
            }

            // 写入截图
            if (request.action === "screenInsert" && currentPageUrl.indexOf('/stage/build/desktop') != -1) {
                        // 拿到数据直接写入思源
                        var currentTime = request.currentTime;
                        var imgUrl = request.imgUrl;
                        // 把截图和时间戳插入到思源中
                        
                        console.log(currentTime);
                        console.log(imgUrl);
                        const videoTimestamp = document.createElement('div');
                        
                        // 获取当前窗口下的datanode
                        document.querySelectorAll(".fn__flex-1.protyle").forEach(async function (node) {
                            // 获取class属性值
                            var className = node.getAttribute("class")
                            if(className == 'fn__flex-1 protyle'){
                                // 判断当前是哪种模式写入   iframe内嵌 还是外部视频
                                var iframe = node.querySelector("iframe");
                                if(iframe){
                                    videoTimestamp.innerHTML = `#### <span data-type="a" data-href="##">[${currentTime}]</span>：`
                                    // iframe内嵌
                                    // 从当前节点里找.sb
                                    var nodeId = node.querySelectorAll(".sb")[1].getAttribute("data-node-id");
                                    // 这里调用一下思源插入内容快的接口
                                    var result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                        "data": videoTimestamp.innerHTML,
                                        "dataType": "markdown",
                                        "parentID": nodeId
                                    });
                                    result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                        "data": `>`,
                                        "dataType": "markdown",
                                        "parentID": nodeId
                                    });
                                    // 这里移动焦点到最新插入的节点
                                    console.log("result is => "+result.data[0].doOperations[0].id)
                                    var newNode = document.querySelector(`[data-node-id="${result.data[0].doOperations[0].id}"]`)
                                    if (newNode) {
                                        node.querySelector(".protyle-content.protyle-content--transition").scrollTop += 1000;
                                        newNode.setAttribute('tabindex', '0');
                                        newNode.focus();
                                    }
                                    // 插入图片  
                                    result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                        "data": `>​![image](${imgUrl})`,
                                        "dataType": "markdown",
                                        "parentID": nodeId
                                    });
                                }
                            }
                        })
                        sendResponse({result: "ok"})
                        return true; // 保持消息通道打开直到sendResponse被调用
            }

            // 外部视频截图指令
            if (request.action === "screenshotOuterVideo") {
                // 判断当前页面的iframe地址是否和request.frameUrl相同
                if(document.URL == request.videoUrl){
                    // 截图
                    var video = document.querySelectorAll('video')[0];
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    var base64Data = canvas.toDataURL('image/png');

                    // 创建一个Blob对象
                    const arr = base64Data.split(',');
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while(n--){
                        u8arr[n] = bstr.charCodeAt(n);
                    }
                    const blob = new Blob([u8arr], {type:mime});

                    blob.name = 'screenshot.png';
                    blob.lastModifiedDate = new Date();

                    // 创建FormData对象并添加文件
                    const formData = new FormData();
                    formData.append('assetsDirPath', '/assets/');
                    // 添加文件，这里我们给文件命名为'screenshot.png'
                    formData.append('file[]', blob, 'screenshot.png');

                    // 这里直接调用思源上传接口
                    var uploadResult = await invokeSiyuanUploadApi(formData);
                    // 获取上传后的图片路径  screenshot.png这个是一个整体
                    // {"code":0,"msg":"","data":{"errFiles":null,"succMap":{"screenshot.png":"assets/screenshot-20240812122103-liwlec4.png"}}}
                    var imgUrl = uploadResult.data.succMap['screenshot.png'];
                    if(imgUrl){
                        var currentTime = parseVideoTimeFromDuration(document.querySelector('video').currentTime*1000);
                        // 这里通过backgroud.js把截图和时间戳转发到content.js
                        chrome.runtime.sendMessage({
                            action: "screenOuterInsert",
                            imgUrl: imgUrl,
                            currentTime: currentTime,
                            videoUrl: request.videoUrl
                        }, function(response) {
                            console.log("content.js receive response => "+JSON.stringify(response));
                        });
                    }else{
                        console.error("截图失败");
                    }
                }else{
                    // 其他页面收到消息后暂停视频
                    var video = document.querySelector('video');
                    if(video){
                        video.pause();
                    }
                }
                sendResponse({result: "ok"})
                return true; // 保持消息通道打开直到sendResponse被调用
            }


            // bilibili 正片页面 注入下载按钮
            if (request.action === "injectBilibiliZhengPianButton" && currentPageUrl.indexOf('bilibili.com/bangumi/play') != -1) {
                console.log(request.data.result.episodes)
                if(true){
                    // 先移除老的下载按钮
                    document.querySelectorAll("#CRX-container").forEach(function (item) {
                        item.remove();
                    })
                    // 注入正片下载按钮
                    injectBilibiliZhengPianButton(request.data.result.episodes);
                }
                sendResponse({result: "ok"})
                return true; // 保持消息通道打开直到sendResponse被调用
            }

            // bilibili 合集页面 注入下载按钮
            if (request.action === "injectBilibiliHeJiButton" && currentPageUrl.indexOf('bilibili.com/video') != -1) {
                console.log(request.data.data.View.ugc_season)
                // 订阅合集节点  .second-line_right 独有
                var heji = document.querySelector(".second-line_right");
                if(heji){
                    // 先移除老的下载按钮
                    document.querySelectorAll("#CRX-container").forEach(function (item) {
                        item.remove();
                    })
                    // 注入合集下载按钮
                    injectBilibiliHeJiButton(request.data.data.View.ugc_season);
                }
                sendResponse({result: "ok"})
                return true; // 保持消息通道打开直到sendResponse被调用
            }
        });
});


/**
 * 单视频&&选集页面 注入下载按钮
 */
function injectBilibiliVideoDownButton(){
    // 创建一个div容器（可选，如果只需要按钮则不需要）
    const crxContainer = document.createElement('div');
    crxContainer.id = 'CRX-container';
    crxContainer.style.position = 'fixed'; // 设置为固定定位
    // 顶部垂直居中对齐
    crxContainer.style.right = '1%';
    crxContainer.style.top = '100px';
    crxContainer.style.transform = 'translateY(-50%)';
    crxContainer.style.display = 'flex';
    crxContainer.style.alignItems = 'center';
    crxContainer.style.zIndex = '1000'; // 确保它位于其他元素之上

    // 创建并填充按钮
    const crxButton = document.createElement('button');
    crxButton.id = 'CRX-container-button';
    crxButton.type = 'button';
    crxButton.style.backgroundColor = 'red'; // 直接在元素上设置样式，而不是通过innerHTML
    crxButton.style.width = '100px';
    crxButton.style.height = '42px';
    crxButton.style.zIndex = '2000'; // 确保它位于其他元素之上
    crxButton.classList.add('Button', 'FollowButton', 'FEfUrdfMIKpQDJDqkjte', 'Button--primary', 'Button--blue', 'epMJl0lFQuYbC7jrwr_o', 'JmYzaky7MEPMFcJDLNMG'); // 添加类名

    // 判断页面类型     合集、选集、单个视频

    // 视频选集节点   .head-left 独有
    var xuanji = document.querySelector(".head-left");
    // 订阅合集节点  .second-line_right 独有
    var heji = document.querySelector(".second-line_right");
    if(xuanji){
        // 选集页面
        crxButton.textContent = '下载选集';
        // 将按钮添加到div容器中（如果需要的话）
        crxContainer.appendChild(crxButton);
        // 将容器添加到页面的body开头
        document.body.insertBefore(crxContainer, document.body.firstChild);
        // 绑定点击事件
        crxButton.addEventListener('click', async function() {
            console.log('下载选集！');
            // 获取视频标题
            var title = document.querySelector(".video-title.special-text-indent").innerText;
            var author = document.querySelector('meta[itemprop="author"]').getAttribute('content').trim();
;
            // 这里调用思源接口创建根目录
            var json = {
                "notebook": notebook,
                "path": "/"+title,
                "markdown":""
            }
            // 调用思源创建文档api
            await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)

            var detailUrl = document.querySelector('meta[itemprop="url"]').getAttribute('content');
            var bvid = detailUrl.split("/")[4]

            // 查询页面.page-num所有节点
            document.querySelectorAll(".page-num").forEach(async function (item, index) {
                var page = item.innerText.replace("P","").trim();
                var duration = item.parentElement.nextElementSibling.innerText;
                var videoTitle = item.nextElementSibling.innerText;
                var videoUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&page=${page}&high_quality=1&as_wide=1&allowfullscreen=true&autoplay=1`;
                // 调用思源接口创建分片文件
                var json = {
                    "notebook": notebook,
                    "path": "/"+title+"/"+page+"-"+videoTitle,
                    "markdown":""
                }
                // 调用思源创建文档api
                var docRes = await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)
                // 然后调用思源模版接口惊醒初始化操作
                json = {
                    "id": docRes.data,
                    "path": pageTemplateUrl
                }
                var renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/template/render",json)
                // 拿到渲染后的markdown
                var markdown = renderResult.data.content;
                // 替换占位符  作者、时间、时长
                markdown = markdown.replace(/{{VideoUrl}}/g,videoUrl)
                markdown = markdown.replace(/{{Author}}/g,author)
                markdown = markdown.replace(/{{Statue}}/g,"未读")
                markdown = markdown.replace(/{{Duration}}/g,duration)

                // 写入数据到思源中
                json = {
                    "dataType": "dom",
                    "data": markdown,
                    "nextID": "",
                    "previousID": "",
                    "parentID": docRes.data
                }
                renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/insertBlock",json)
            })
        });
    }else if(heji){
        // 合集跳过不处理 通过接口劫持注入
    }else{
        // 单独视频页面
        crxButton.textContent = '下载单视频';
        // 将按钮添加到div容器中（如果需要的话）
        crxContainer.appendChild(crxButton);
        // 将容器添加到页面的body开头
        document.body.insertBefore(crxContainer, document.body.firstChild);
        // 绑定点击事件
        crxButton.addEventListener('click', async function() {
            console.log('下载单视频！');
            // 获取视频标题
            var title = document.querySelector(".video-title.special-text-indent").innerText;
            var author = document.querySelector('meta[itemprop="author"]').getAttribute('content').trim();
            var duration = document.querySelector(".bpx-player-ctrl-time-duration").innerText;
            // 这里调用思源接口创建根目录
            var json = {
                "notebook": notebook,
                "path": "/"+title,
                "markdown":""
            }
            // 调用思源创建文档api
            var docRes = await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)
            // 然后调用思源模版接口惊醒初始化操作
            json = {
                "id": docRes.data,
                "path": pageTemplateUrl
            }
            var renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/template/render",json)
            // 拿到渲染后的markdown
            var markdown = renderResult.data.content;

            var detailUrl = document.querySelector('meta[itemprop="url"]').getAttribute('content');
            var bvid = detailUrl.split("/")[4]

            var videoUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&as_wide=1&allowfullscreen=true&autoplay=1`;
            // 替换占位符  作者、时间、时长
            markdown = markdown.replace(/{{VideoUrl}}/g,videoUrl)
            markdown = markdown.replace(/{{Author}}/g,author)
            markdown = markdown.replace(/{{Statue}}/g,"未读")
            markdown = markdown.replace(/{{Duration}}/g,duration)            
            
            // 写入数据到思源中
            json = {
                "dataType": "dom",
                "data": markdown,
                "nextID": "",
                "previousID": "",
                "parentID": docRes.data
            }
            renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/insertBlock",json)
        });
    }
}

/**
 * 正片注入下载按钮 走劫持逻辑
 * @param {*} episodes 
 */
function injectBilibiliZhengPianButton(episodes){
        // 创建一个div容器（可选，如果只需要按钮则不需要）
        const crxContainer = document.createElement('div');
        crxContainer.id = 'CRX-container';
        crxContainer.style.position = 'fixed'; // 设置为固定定位
        // 顶部垂直居中对齐
        crxContainer.style.right = '1%';
        crxContainer.style.top = '100px';
        crxContainer.style.transform = 'translateY(-50%)';
        crxContainer.style.display = 'flex';
        crxContainer.style.alignItems = 'center';
        crxContainer.style.zIndex = '1000'; // 确保它位于其他元素之上

        // 创建并填充按钮
        const crxButton = document.createElement('button');
        crxButton.id = 'CRX-container-button';
        crxButton.type = 'button';
        crxButton.style.backgroundColor = 'red'; // 直接在元素上设置样式，而不是通过innerHTML
        crxButton.style.width = '100px';
        crxButton.style.height = '42px';
        crxButton.style.zIndex = '2000'; // 确保它位于其他元素之上
        crxButton.classList.add('Button', 'FollowButton', 'FEfUrdfMIKpQDJDqkjte', 'Button--primary', 'Button--blue', 'epMJl0lFQuYbC7jrwr_o', 'JmYzaky7MEPMFcJDLNMG'); // 添加类名
        // 单独视频页面
        crxButton.textContent = document.querySelector(".mediainfo_mediaTitle__Zyiqh").innerText;
        // 将按钮添加到div容器中（如果需要的话）
        crxContainer.appendChild(crxButton);
        // 将容器添加到页面的body开头
        document.body.insertBefore(crxContainer, document.body.firstChild);
        crxButton.addEventListener('click', async function() {
            console.log('下载正片！');
            // 获取视频标题
            var title = crxButton.textContent;
            var author = document.querySelector('meta[property="og:title"]').getAttribute('content').trim();
            // 这里调用思源接口创建根目录
            var json = {
                "notebook": notebook,
                "path": "/"+title,
                "markdown":""
            }
            // 调用思源创建文档api
            await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)

            // 遍历episodes
            episodes.forEach(async function (item, index) {
                // 获取视频标题
                var videoTitle = item.long_title || item.title;
                var duration = parseVideoTimeFromDuration(item.duration);
                var bvid = item.bvid;
                // 获取视频地址
                var videoUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&as_wide=1&allowfullscreen=true&autoplay=1`;
                // 调用思源接口创建分片文件
                json = {
                    "notebook": notebook,
                    "path": "/"+title+"/"+(index+1)+"-"+videoTitle,
                    "markdown":""
                }
                // 调用思源创建文档api
                var docRes = await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)
                // 然后调用思源模版接口惊醒初始化操作
                json = {
                    "id": docRes.data,
                    "path": pageTemplateUrl
                }
                var renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/template/render",json)
                // 拿到渲染后的markdown
                var markdown = renderResult.data.content;
                // 替换占位符  作者、时间、时长
                markdown = markdown.replace(/{{VideoUrl}}/g,videoUrl)
                markdown = markdown.replace(/{{Author}}/g,author)
                markdown = markdown.replace(/{{Statue}}/g,"未读")
                markdown = markdown.replace(/{{Duration}}/g,duration)
                // 写入数据到思源中
                json = {
                    "dataType": "dom",
                    "data": markdown,
                    "nextID": "",
                    "previousID": "",
                    "parentID": docRes.data
                }
                renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/insertBlock",json)
            })
        });
}

/**
 * 把视频时长转换成字符串格式 
 * 参数单位是毫秒
 * @param {*} milliseconds 
 * @returns 
 */
function parseVideoTimeFromDuration(milliseconds){
    // 计算小时数
    var hours = Math.floor(milliseconds / (60 * 60 * 1000));
    // 计算剩余的分钟数
    var minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    // 计算剩余的秒数
    var seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

    // 格式化小时、分钟和秒，确保它们是两位数
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');

    // 根据时长判断并拼接字符串
    if (hours > 0) {
        return `${hours}:${minutes}:${seconds}`; // xx:yy:zz
    } else if (minutes > 0) {
        return `${minutes}:${seconds}`; // xx:yy
    } else {
        // 如果分钟和小时都为0，但秒数可能不为0（尽管在这个特定情况下它会是0，因为至少要有1秒）
        // 但为了完整性，我们还是返回秒数（尽管前导0可能看起来不必要）
        return `00:${seconds}`; // 00:xx，但注意这个分支实际上不太可能被触发，除非有特别的逻辑需要它
        // 或者，如果确实只需要在秒数大于0时才显示，可以改为：
        // return seconds > 0 ? `00:${seconds}` : '00:00';
    }
}

/**
 * 合集注入下载按钮 走劫持逻辑
 * @param {*} ugc_season 
 */
function injectBilibiliHeJiButton(ugc_season){
        // 创建一个div容器（可选，如果只需要按钮则不需要）
        const crxContainer = document.createElement('div');
        crxContainer.id = 'CRX-container';
        crxContainer.style.position = 'fixed'; // 设置为固定定位
        // 顶部垂直居中对齐
        crxContainer.style.right = '1%';
        crxContainer.style.top = '100px';
        crxContainer.style.transform = 'translateY(-50%)';
        crxContainer.style.display = 'flex';
        crxContainer.style.alignItems = 'center';
        crxContainer.style.zIndex = '1000'; // 确保它位于其他元素之上

        // 创建并填充按钮
        const crxButton = document.createElement('button');
        crxButton.id = 'CRX-container-button';
        crxButton.type = 'button';
        crxButton.style.backgroundColor = 'red'; // 直接在元素上设置样式，而不是通过innerHTML
        crxButton.style.width = '100px';
        crxButton.style.height = '42px';
        crxButton.style.zIndex = '2000'; // 确保它位于其他元素之上
        crxButton.classList.add('Button', 'FollowButton', 'FEfUrdfMIKpQDJDqkjte', 'Button--primary', 'Button--blue', 'epMJl0lFQuYbC7jrwr_o', 'JmYzaky7MEPMFcJDLNMG'); // 添加类名
        // 单独视频页面
        crxButton.textContent = '下载合集';
        // 将按钮添加到div容器中（如果需要的话）
        crxContainer.appendChild(crxButton);
        // 将容器添加到页面的body开头
        document.body.insertBefore(crxContainer, document.body.firstChild);        
        // 绑定点击事件
        crxButton.addEventListener('click', async function() {
            console.log('下载合集！');
            // 获取视频标题
            var title = ugc_season.title;
            var author = document.querySelector('meta[itemprop="author"]').getAttribute('content').trim();
            // 这里调用思源接口创建根目录
            var json = {
                "notebook": notebook,
                "path": "/"+title,
                "markdown":""
            }
            // 调用思源创建文档api
            await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)

            // 遍历ugc_season.sections
            ugc_season.sections.forEach(async function (item, secIndex) {
                // 获取分区标题
                var secTitle = item.title;
                // 这里调用思源接口创建根目录
                json = {
                    "notebook": notebook,
                    "path": "/"+title+"/"+(secIndex+1)+"-"+secTitle,
                    "markdown":""
                }
                // 调用思源创建文档api
                await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)
                // 遍历item.episodes
                item.episodes.forEach(async function (ep, index) {
                    var bvid = ep.bvid;
                    var videoTitle = ep.title;
                    var videoUrl = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&as_wide=1&allowfullscreen=true&autoplay=1`
                    var duration = parseVideoTimeFromDuration(ep.arc.duration*1000)
                    // 这里调用思源接口创建根目录
                    json = {
                        "notebook": notebook,
                        "path": "/"+title+"/"+(secIndex+1)+"-"+secTitle+"/"+(index+1)+"-"+videoTitle,
                        "markdown":""
                    }
                    // 调用思源创建文档api
                    var docRes = await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)
                    // 然后调用思源模版接口惊醒初始化操作
                    json = {
                        "id": docRes.data,
                        "path": pageTemplateUrl
                    }
                    var renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/template/render",json)
                    // 拿到渲染后的markdown
                    var markdown = renderResult.data.content;
                    // 替换markdown占位符
                    markdown = markdown.replace(/{{VideoUrl}}/g,videoUrl)
                    markdown = markdown.replace(/{{Author}}/g,author)
                    markdown = markdown.replace(/{{Statue}}/g,"未读")
                    markdown = markdown.replace(/{{Duration}}/g,duration)
                    // 写入数据到思源中
                    json = {
                        "dataType": "dom",
                        "data": markdown,
                        "nextID": "",
                        "previousID": "",
                        "parentID": docRes.data
                    }
                    renderResult = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/insertBlock",json)
                })
             })
        });
}

/**
 * 时间戳按钮注入以及事件绑定
 */
function injectVideoJumpButton(){
            // 这里等待#toolbarVIP加载出来再继续执行
            if (document.querySelector("#toolbarVIP") === null) {
                setTimeout(injectVideoJumpButton, 100);
                return;
            }

            // 创建新元素
            const insertDiv = document.createElement('div');
            insertDiv.innerHTML = `<div data-menu="true" id="extension-video-insert" class="toolbar__item ariaLabel" aria-label="插入时间戳" data-position="right">🐞</div>`;

            const resetDiv = document.createElement('div');
            resetDiv.innerHTML = `<div data-menu="true" id="extension-video-reset" class="toolbar__item ariaLabel" aria-label="还原窗口" data-position="right">🪲</div>`;

            const screenDiv = document.createElement('div');
            screenDiv.innerHTML = `<div data-menu="true" id="extension-video-screen" class="toolbar__item ariaLabel" aria-label="截图" data-position="right">📷</div>`;

            // 获取#toolbarVIP元素
            const toolbarVIP = document.getElementById('toolbarVIP');

            // 将新元素添加到#toolbarVIP后面
            toolbarVIP.insertAdjacentElement('afterend', insertDiv);
            insertDiv.insertAdjacentElement('afterend', resetDiv);
            resetDiv.insertAdjacentElement('afterend', screenDiv);

            var insertBtn = document.getElementById('extension-video-insert');
            var resetBtn = document.getElementById('extension-video-reset');
            var screenBtn = document.getElementById('extension-video-screen');
    
            // 重置视频窗口监听事件
            resetBtn.addEventListener('click', function() {
                // 获取当前窗口的iframe的url
                document.querySelectorAll(".fn__flex-1.protyle").forEach(function (node) {
                    // 获取class属性值
                    var className = node.getAttribute("class")
                    if(className == 'fn__flex-1 protyle'){
                        // 先判断iframe存不存在  存在调整样式
                        var iframe = node.querySelectorAll("iframe")[0];
                        if(iframe){
                            node.querySelectorAll(".iframe-content")[0].style.position = "relative";
                        }else{
                            console.log("iframe不存在");
                        }
                        // 滚动条移动到最上面
                        node.querySelector(".protyle-content.protyle-content--transition").scrollTop = 0;
                    }
                });
            });

            // 截图监听事件
            screenBtn.addEventListener('click', function() {
                // 获取当前窗口的iframe的url
                document.querySelectorAll(".fn__flex-1.protyle").forEach(function (node) {
                    // 获取class属性值
                    var className = node.getAttribute("class")
                    if(className == 'fn__flex-1 protyle'){
                        // 判断当前文档树是否展开 如果展开 点击关闭
                        // dock__item ariaLabel dock__item--active
                        var menuNode = document.querySelector(".dock__item.ariaLabel.dock__item--active");
                        if(menuNode){
                            var dataTitle = menuNode.getAttribute("data-title");
                            if(dataTitle && dataTitle == "大纲"){
                                console.log("大纲模式,不处理");
                            }else{
                                menuNode.click();
                            }
                        }

                        // 先判断iframe存不存在  存在调整样式
                        var iframe = node.querySelectorAll("iframe")[0];
                        if(iframe){
                            // 每次点击时间戳 都要把当前页面iframe固定住
                            // .iframe-content样式中 position:relative;
                            node.querySelectorAll(".iframe-content")[0].style.position = "fixed";
                            // iframe-content的width要和.protyle-wysiwyg.iframe中的width保持一致
                            node.querySelectorAll("iframe")[0].style.removeProperty("width");
    
                            // 先找到对应的iframe  通知backgroud.js转发截图请求
                            var frameUrl = node.querySelectorAll("iframe")[0].getAttribute("src")
                            chrome.runtime.sendMessage({action: "screenshot",frameUrl:frameUrl}, function(response) {
                            });
                        }else{
                            console.log("iframe不存在,分屏模式");
                            // 获取当前窗口首个span[data-href='###']且innerText为http的值
                            var videoUrl = node.querySelector("span[data-href='###']").innerText;
                            if(videoUrl && videoUrl.indexOf("http") != -1){
                                // 通过backgroud.js 发送截图指令
                                chrome.runtime.sendMessage({action: "screenshotOuterVideo",videoUrl:videoUrl}, function(response) {
                                });
                            }
                        }
                    }
                });
            });

            // 时间戳按钮点击事件
            insertBtn.addEventListener('click', function() {
                // 这里添加您的爬虫处理代码
                console.log('按钮被点击了！');

                // 获取当前窗口的iframe的url
                document.querySelectorAll(".fn__flex-1.protyle").forEach(function (node) {
                    // 获取class属性值
                    var className = node.getAttribute("class")
                    if(className == 'fn__flex-1 protyle'){
                        // 判断当前文档树是否展开 如果展开 点击关闭
                        // dock__item ariaLabel dock__item--active
                        var menuNode = document.querySelector(".dock__item.ariaLabel.dock__item--active");
                        if(menuNode){
                            var dataTitle = menuNode.getAttribute("data-title");
                            if(dataTitle && dataTitle == "大纲"){
                                console.log("大纲模式,不处理");
                            }else{
                                menuNode.click();
                            }
                        }

                        // 判断iframe存不存在  存在调整样式
                        var iframe = node.querySelectorAll("iframe")[0];
                        if(iframe){
                            // 每次点击时间戳 都要把当前页面iframe固定住
                            // .iframe-content样式中 position:relative;
                            node.querySelectorAll(".iframe-content")[0].style.position = "fixed";
                            // iframe-content的width要和.protyle-wysiwyg.iframe中的width保持一致
                            node.querySelectorAll("iframe")[0].style.removeProperty("width");
    
                            var frameUrl = node.querySelectorAll("iframe")[0].getAttribute("src");
                            // 发送消息到background.js获取iframe视频时间
                            chrome.runtime.sendMessage({action: "queryInnerIframe",frameUrl:frameUrl}, async function(response) {
                                console.log('Received iframe video time :', response.currentTime);
                                // 往页面插入时间戳
                                const videoTimestamp = document.createElement('div');
                                videoTimestamp.innerHTML = `#### <span data-type="a" data-href="##">[${response.currentTime}]</span>：`
                                
                                // 从当前节点里找.sb
                                var nodeId = node.querySelectorAll(".sb")[1].getAttribute("data-node-id");
                                // 这里调用一下思源插入内容快的接口
                                var result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                    "data": videoTimestamp.innerHTML,
                                    "dataType": "markdown",
                                    "parentID": nodeId
                                });
                                result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                    "data": `>`,
                                    "dataType": "markdown",
                                    "parentID": nodeId
                                });
                                // 这里移动焦点到最新插入的节点
                                console.log("result is => "+result.data[0].doOperations[0].id)
                                var newNode = document.querySelector(`[data-node-id="${result.data[0].doOperations[0].id}"]`)
                                if (newNode) {
                                    node.querySelector(".protyle-content.protyle-content--transition").scrollTop += 1000;
                                    newNode.setAttribute('tabindex', '0');
                                    newNode.focus();
                                }
                            });
                        }else{
                            console.log("iframe不存在,分屏模式");
                            // 从这里面去拿 
                            var videoUrl = node.querySelector("span[data-href='###']").innerText;
                            // 获取当前窗口首个span[data-href='###']且innerText为http的值
                            if(videoUrl && videoUrl.indexOf("http") != -1){
                                // 通过backgroud.js 获取视频页面进度
                                chrome.runtime.sendMessage({action: "queryOuterVideo",videoUrl:videoUrl}, async function(response) {
                                    // 拿到时间戳  往当前文档插入数据
                                    console.log('Received iframe video time :', response.currentTime);
                                    // 往页面插入时间戳
                                    const videoTimestamp = document.createElement('div');
                                    videoTimestamp.innerHTML = `#### <span data-type="a" data-href="###" data-title="${videoUrl}">[${response.currentTime}]</span>：`
                                    
                                    var nodeId = node.querySelector(".protyle-breadcrumb__item.protyle-breadcrumb__item--active").getAttribute("data-node-id");
                                    // 这里调用一下思源插入内容快的接口
                                    var result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                        "data": videoTimestamp.innerHTML,
                                        "dataType": "markdown",
                                        "parentID": nodeId
                                    });
                                    result = await invokeSiyuanApi("http://127.0.0.1:6806/api/block/appendBlock",{
                                        "data": `>`,
                                        "dataType": "markdown",
                                        "parentID": nodeId
                                    });
                                    // 这里移动焦点到最新插入的节点
                                    console.log("result is => "+result.data[0].doOperations[0].id)
                                    var newNode = document.querySelector(`[data-node-id="${result.data[0].doOperations[0].id}"]`)
                                    if (newNode) {
                                        node.querySelector(".protyle-content.protyle-content--transition").scrollTop += 1000;
                                        newNode.setAttribute('tabindex', '0');
                                        newNode.focus();
                                    }
                                });
                            }
                        }
                    }
                })
            });
}

/**
 * 定位视频详情页
 * @param {*} videoUrl 
 */
function openOuterVideo(videoUrl){
    // 定位思源视频详情页  存在则定位 不存在则创建
    chrome.runtime.sendMessage({action: "openOuterVideo",videoUrl:videoUrl}, function(response) {
    });
}


/**
 * 外部视频时间戳跳转
 * @param {*} time 
 * @param {*} videoUrl 
 */
function dumpOuterVideo(time, videoUrl){
    chrome.runtime.sendMessage({action: "dumpOuterVideo",time:time,videoUrl:videoUrl}, function(response) {
    });
}

/**
 * 思源页面内嵌视频跳转
 *
 * @param time 时间戳
 * @returns 无返回值，通过回调函数输出响应结果
 */
function dumpInnerVideo(time,frameUrl){
    // 消息先发送到background.js 再由background.js 发送到各个content.js  找到匹配的iframe进行跳转
    chrome.runtime.sendMessage({action: "dumpInnerVideo",time:time,frameUrl:frameUrl}, function(response) {
    });
}

/**
 * 调用思源api
 * @param {} url 
 * @param {*} json 
 * @returns 
 */
async function invokeSiyuanApi(url,json){
    console.log("invoke siyuan api:"+url)
    console.log("invoke siyuan json:"+JSON.stringify(json))

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": Authorization,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(json)
        });
        // 确保响应状态码是2xx
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // 你可以继续处理响应，例如获取JSON数据
        const data = await response.json();
        console.log("invoke siyuan api success,result is "+JSON.stringify(data))
        return data;
    } catch (error) {
        console.error('There has been a problem with your invokeSiyuanApi operation:', error);
    }
}


/**
 * 上传文件
 * @param {*} url 
 * @param {*} json 
 * @returns 
 */
async function invokeSiyuanUploadApi(formData){

    try {
        const response = await fetch("http://127.0.0.1:6806/api/asset/upload", {
            method: "POST",
            headers: {
                "Authorization": Authorization,
            },
            body: formData
        });
        // 确保响应状态码是2xx
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // 你可以继续处理响应，例如获取JSON数据
        const data = await response.json();
        console.log("invoke siyuan upload api success,result is "+JSON.stringify(data))
        return data;
    } catch (error) {
        console.error('There has been a problem with your invokeSiyuanApi operation:', error);
    }
}