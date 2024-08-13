// B站视频iframe
if (document.URL.indexOf("player.bilibili.com/player.html") > -1) {
    console.log("load bilibili video iframe js success ~  current url: " + document.URL);
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    // 只匹配目标url的请求
    if (document.URL.indexOf("player.bilibili.com/player.html") > -1) {
        // 视频跳转指令
        if (request.action === "dumpFrameVideo") {
            // 判断是否是当前页面
            if (request.frameUrl && request.frameUrl == document.URL) {
                console.log("bilibili iframe js = > dumpFrameVideo:跳转视频到指定时间", request.time);
                document.querySelector("video").currentTime = request.time;
                document.querySelector("video").play();
                sendResponse({ result: "ok" });
                return true;
            } else {
                // 其余收到相同消息的暂停播放
                document.querySelector("video").pause();
                return false;
            }
        }

        // 查询视频进度指令
        if (request.action === "queryIframeVideo") {
            // 判断当前页面的iframe地址是否和request.frameUrl相同
            if (request.frameUrl && request.frameUrl == document.URL) {
                sendResponse({ time: document.querySelector("video").currentTime });
                console.log("bilibili iframe js = > queryIframeVideo:查询视频时间", document.querySelector("video").currentTime);
                document.querySelector("video").play();
                return true;
            } else {
                // 其余收到相同消息的暂停播放
                document.querySelector("video").pause();
                return false;
            }
        }

        // 视频截图指令
        if (request.action === "screenIframe") {
            // 判断当前页面的iframe地址是否和request.frameUrl相同
            if (request.frameUrl && request.frameUrl == document.URL) {
                // 截图
                console.log("bilibili iframe js = > screenIframe:截图");
                var video = document.querySelector("video");
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                var base64Data = canvas.toDataURL("image/png");

                // 创建一个Blob对象
                const arr = base64Data.split(",");
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });

                blob.name = "screenshot.png";
                blob.lastModifiedDate = new Date();

                // 创建FormData对象并添加文件
                const formData = new FormData();
                formData.append("assetsDirPath", "/assets/");
                // 添加文件，这里我们给文件命名为'screenshot.png'
                formData.append("file[]", blob, "screenshot.png");

                // 这里直接调用思源上传接口
                var uploadResult = await invokeSiyuanUploadApi(formData);
                // 获取上传后的图片路径  screenshot.png这个是一个整体
                // {"code":0,"msg":"","data":{"errFiles":null,"succMap":{"screenshot.png":"assets/screenshot-20240812122103-liwlec4.png"}}}
                var imgUrl = uploadResult.data.succMap["screenshot.png"];
                if (imgUrl) {
                    var currentTime = parseVideoTimeFromDuration(document.querySelector("video").currentTime * 1000);
                    // 这里通过backgroud.js把截图和时间戳转发到content.js
                    chrome.runtime.sendMessage(
                        {
                            action: "screenInsert",
                            imgUrl: imgUrl,
                            currentTime: currentTime,
                        },
                        function (response) {
                            // console.log("content.js receive response => " + JSON.stringify(response));
                        }
                    );
                    document.querySelector("video").play();
                    console.log("bilibili iframe js = > screenIframe:截图成功");
                } else {
                    console.error("bilibili iframe js = > screenIframe:截图失败");
                }
                return true;
            } else {
                // 其余收到相同消息的暂停播放
                document.querySelector("video").pause();
                return false;
            }
        }
    }
});
