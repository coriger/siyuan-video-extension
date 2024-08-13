// 百度网盘
if(document.URL.indexOf("pan.baidu.com/disk/main") > -1){
    console.log("load baidu disk js success ~  current url: " + document.URL)
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // 只匹配目标url的请求
    if(document.URL.indexOf("pan.baidu.com/disk/main") > -1){
        if (request.action === "injectDownloadButton") {
            console.log("百度下载按钮注入：",request.data.list)

            // 判断当前主路径 
            var paths = document.querySelectorAll(".wp-s-pan-file-main__nav-item-title.text-ellip");
            if(paths && paths.length > 0){
                var pathName = paths[paths.length-1].innerText;
                // 这里提前检查下data里面的数据 看是否是文件夹 如果都是文件夹就不注入下载按钮了
                var existVideo = false;
                request.data.list.forEach(async function (item, index) {
                    // 存在视频文件
                    if(item.isdir == "0"){
                        existVideo = true;
                        return false;
                    }
                })
                // 注入下载按钮
                if(existVideo){
                    injectBaiduPanButton(request.data.list,pathName);
                }
            }else{
                // 移除页面所有button
                document.querySelectorAll("#button-container").forEach(function (item) {
                    item.remove();
                })
                console.log("没有找到主路径，无法注入下载按钮！");
            }
            return true; // 保持消息通道打开直到sendResponse被调用
        } 
    }
})


/**
 * 百度网盘页面注入下载按钮
 * @param {*} data 
 */
function injectBaiduPanButton(data,pathName){
    // 创建一个div容器（可选，如果只需要按钮则不需要）
    var crxContainer = document.getElementById("button-container");
    if(!crxContainer){
        crxContainer = document.createElement('div');
        crxContainer.id = "button-container";
        crxContainer.style.position = 'fixed'; // 设置为固定定位
        // 顶部垂直居中对齐
        crxContainer.style.top = '5%';
        // 设置里面的按钮间隔50px
        crxContainer.style.padding = '50px';
        // 居中对齐
        crxContainer.style.left = '50%';
        crxContainer.style.zIndex = '1000'; // 确保它位于其他元素之上
    }

    // 创建并填充按钮
    const crxButton = document.createElement('button');
    crxButton.type = 'button';
    crxButton.position = 'absolute';
    crxButton.style.marginLeft = "10px";
    crxButton.style.backgroundColor = 'red'; // 直接在元素上设置样式，而不是通过innerHTML
    crxButton.style.width = '64px';
    crxButton.style.height = '28px';
    crxButton.style.zIndex = '1000'; // 确保它位于其他元素之上
    // 单独视频页面
    crxButton.textContent = pathName.slice(0, 6)+"("+data.length+")";
    // 将按钮添加到div容器中（如果需要的话）
    crxContainer.appendChild(crxButton);
    // 将容器添加到页面的body开头
    document.body.insertBefore(crxContainer, document.body.firstChild);

    crxButton.addEventListener('click', function() {
        console.log('下载！');
        // 遍历data
        data.forEach(async function (item, index) {
            // 获取视频标题
            var videoTitle = item.server_filename;
            var path = encodeURIComponent(item.path);
            // 获取视频地址
            var videoUrl = `https://pan.baidu.com/pfile/video?path=${path}`;
            console.log(videoTitle+":"+videoUrl);
            // 调用思源接口创建分片文件
            json = {
                "notebook": notebook,
                "path": "/"+pathName+"/"+videoTitle,
                "markdown":`<span data-type="a" data-href="###">${videoUrl}</span>`
            }
            // 调用思源创建文档api
            await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd",json)
        })

        // 移除当前按钮
        crxButton.remove();
    });
}