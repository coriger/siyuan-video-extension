// youtube视频播放页
if (document.URL.indexOf("youtube.com/watch") > -1 || document.URL.indexOf("youtube.com/playlist") > -1) {
    console.log("load youtube_web js success ~  current url: " + document.URL);
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    // 只匹配目标url的请求
    if (document.URL.indexOf("youtube.com/watch") > -1 || document.URL.indexOf("youtube.com/playlist") > -1) {
    }
});

/**
 * 单视频页注入下载按钮
 */
function injectYoutubeVideoDownButton() {
    // 创建一个div容器（可选，如果只需要按钮则不需要）
    const crxContainer = document.createElement("div");
    crxContainer.id = "CRX-container";
    crxContainer.style.position = "fixed"; // 设置为固定定位
    // 顶部垂直居中对齐
    crxContainer.style.right = "1%";
    crxContainer.style.top = "100px";
    crxContainer.style.transform = "translateY(-50%)";
    crxContainer.style.display = "flex";
    crxContainer.style.alignItems = "center";
    crxContainer.style.zIndex = "1000"; // 确保它位于其他元素之上

    // 创建并填充按钮
    const crxButton = document.createElement("button");
    crxButton.id = "CRX-container-button";
    crxButton.type = "button";
    crxButton.style.backgroundColor = "red"; // 直接在元素上设置样式，而不是通过innerHTML
    crxButton.style.width = "100px";
    crxButton.style.height = "42px";
    crxButton.style.zIndex = "2000"; // 确保它位于其他元素之上
    crxButton.classList.add("Button", "FollowButton", "FEfUrdfMIKpQDJDqkjte", "Button--primary", "Button--blue", "epMJl0lFQuYbC7jrwr_o", "JmYzaky7MEPMFcJDLNMG"); // 添加类名

    // 单独视频页面
    crxButton.textContent = "下载单视频";
    // 将按钮添加到div容器中（如果需要的话）
    crxContainer.appendChild(crxButton);
    // 将容器添加到页面的body开头
    document.body.insertBefore(crxContainer, document.body.firstChild);
    // 绑定点击事件
    crxButton.addEventListener("click", async function () {
        console.log("下载单视频！");
        // 获取视频标题
        var title = document.title.trim().replace("/","");
        var author = document.querySelector('.style-scope.ytd-channel-name.complex-string').getAttribute("title").trim();
        var currentPageUrl = document.URL;
        // 这里调用思源接口创建根目录
        var json = {
            notebook: notebook,
            path: "/Video-视频库/" + author + "/" + title,
            markdown: `<span data-type="a" data-href="###">${currentPageUrl}</span>`,
        };
        // 调用思源创建文档api
        await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd", json);
        // 移除下载按钮
        crxButton.remove();
    });
}

/**
 * 视频列表页注入下载按钮
 */
function injectYoutubePlaylistDownButton() {
    // 创建一个div容器（可选，如果只需要按钮则不需要）
    const crxContainer = document.createElement("div");
    crxContainer.id = "CRX-container";
    crxContainer.style.position = "fixed"; // 设置为固定定位
    // 顶部垂直居中对齐
    crxContainer.style.right = "1%";
    crxContainer.style.top = "100px";
    crxContainer.style.transform = "translateY(-50%)";
    crxContainer.style.display = "flex";
    crxContainer.style.alignItems = "center";
    crxContainer.style.zIndex = "1000"; // 确保它位于其他元素之上

    // 创建并填充按钮
    const crxButton = document.createElement("button");
    crxButton.id = "CRX-container-button";
    crxButton.type = "button";
    crxButton.style.backgroundColor = "red"; // 直接在元素上设置样式，而不是通过innerHTML
    crxButton.style.width = "100px";
    crxButton.style.height = "42px";
    crxButton.style.zIndex = "2000"; // 确保它位于其他元素之上
    crxButton.classList.add("Button", "FollowButton", "FEfUrdfMIKpQDJDqkjte", "Button--primary", "Button--blue", "epMJl0lFQuYbC7jrwr_o", "JmYzaky7MEPMFcJDLNMG"); // 添加类名

    // 单独视频页面
    crxButton.textContent = "下载列表";
    // 将按钮添加到div容器中（如果需要的话）
    crxContainer.appendChild(crxButton);
    // 将容器添加到页面的body开头
    document.body.insertBefore(crxContainer, document.body.firstChild);
    // 绑定点击事件
    crxButton.addEventListener("click", async function () {
        console.log("下载列表");
        // 获取视频标题
        var title = document.title.trim().replace("/","");
        var author = document.querySelector(".metadata-action-bar.style-scope.ytd-playlist-header-renderer").querySelector(".yt-simple-endpoint.style-scope.yt-formatted-string").innerHTML.trim();
        // 获取视频了表
        var videoList = document.querySelectorAll(".yt-simple-endpoint.style-scope.ytd-playlist-video-renderer");
        // 遍历视频列表
        videoList.forEach(async function (item, index) {
            // 获取视频标题
            var videoTitle = item.getAttribute("title");
            var duration = item.parentElement.parentElement.parentElement.querySelector(".badge-shape-wiz__text").innerHTML.trim();
            // 获取
            var videoUrl = "https://www.youtube.com/embed/"+item.getAttribute("href").split("&")[0].split("=")[1];


            // 调用思源接口创建分片文件
            var json = {
                "notebook": notebook,
                "path": `/Video-视频库/${author}/${title}/${index+1}-${videoTitle}`,
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

            // // 这里调用思源接口创建根目录
            // var json = {
            //     notebook: notebook,
            //     path: `/Video-视频库/${author}/${title}/${index+1}-${videoTitle}`,
            //     markdown: `<span data-type="a" data-href="###">${videoUrl}</span>`,
            // };
            // // 调用思源创建文档api
            // await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd", json);
        })
        // 移除下载按钮
        crxButton.remove();
    });
}
