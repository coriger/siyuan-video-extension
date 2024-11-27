var crawlCount = 0
// 创建一个map
var questionMap = new Map();
var answerMap = new Map();

function reset() {
    crawlCount = 0
    questionMap = new Map();
    answerMap = new Map();
}

/**
 * 知乎话题精华问题下载按钮
 */
function injectZhihuTopicQuestionDownButton(url) {
    if (url.indexOf('topic') > -1) {
        const crxApp = document.createElement('div')
        crxApp.id = 'CRX-container'
        // 填充CRX-container的内容
        crxApp.innerHTML = `
        <button id="CRX-container-button" type="button" style="background-color:red" class="Button FollowButton FEfUrdfMIKpQDJDqkjte Button--primary Button--blue epMJl0lFQuYbC7jrwr_o JmYzaky7MEPMFcJDLNMG">抓取精华</button>`
        // 把crxApp插入到class=QuestionHeader-footer-main的div中
        document.querySelector('.TopicActions').appendChild(crxApp)
        // 点击按钮后进行爬虫处理
        const button = document.getElementById('CRX-container')
        button.addEventListener('click', function () {
            // 重置计数器
            reset();
            // 主题精华
            // 接口：  https://www.zhihu.com/api/v5.1/topics/20069068/feeds/top_activity
            var topicId = url.split("/")[4];
            var apiUrl = "https://www.zhihu.com/api/v5.1/topics/" + topicId + "/feeds/top_activity";
            // 获取页面topicName
            var topicName = document.querySelector(".TopicMetaCard-title").innerText;
            // 调用接口
            recursiveFetchTopicQuestion(topicName, [apiUrl])
        })
    } else if (url.indexOf('zhihu.com/question') > -1 && url.indexOf('answer') == -1) {
        const crxApp = document.createElement('div')
        crxApp.id = 'CRX-container'
        // 填充CRX-container的内容
        crxApp.innerHTML = `
        <button id="CRX-container-button" type="button" style="background-color:red" class="Button FollowButton FEfUrdfMIKpQDJDqkjte Button--primary Button--blue epMJl0lFQuYbC7jrwr_o JmYzaky7MEPMFcJDLNMG">抓取数据</button>`
        // 把crxApp插入到class=QuestionHeader-footer-main的div中
        document.querySelector('.QuestionHeader-footer-main').appendChild(crxApp)
        // 点击按钮后进行爬虫处理
        const button = document.getElementById('CRX-container')
        button.addEventListener('click', function () {
            // 重置计数器
            reset();
            crawlQuestionAnswer(currentPageUrl)
        })
    }else if(url.indexOf('zhihu.com/question') > -1 && url.indexOf('answer') > -1){  // 个人回答页  需要跳转到问题页抓取
        // 跳转问题页面
        const crxApp = document.createElement('div')
        crxApp.id = 'CRX-container'
        // 填充CRX-container的内容
        crxApp.innerHTML = `
        <button id="CRX-container-button" type="button" style="background-color:red" class="Button FollowButton FEfUrdfMIKpQDJDqkjte Button--primary Button--blue epMJl0lFQuYbC7jrwr_o JmYzaky7MEPMFcJDLNMG">跳转问题页</button>`
        // 把crxApp插入到class=QuestionHeader-footer-main的div中
        document.querySelector('.QuestionHeader-footer-main').appendChild(crxApp)
        // 点击按钮后进行爬虫处理
        const button = document.getElementById('CRX-container')
        button.addEventListener('click', function() {
            var questionId = currentPageUrl.split("/")[4];
            window.location.href = "https://www.zhihu.com/question/" + questionId;
        })
    }
}


async function crawlQuestionAnswer(currentPageUrl) {
    // 使用request.selector来查询DOM元素
    var script_content = document.getElementById("js-initialData").text;
    // 解析URL
    // 路径的格式总是https://www.zhihu.com/question/655908190，获取问题Id
    questionId = currentPageUrl.split("/")[4];
    // 找到script_content里initialState下的question下的answers下的656294274下的next字段
    // 把scrip_content转成json格式
    jsonData = JSON.parse(script_content);
    questionName = document.querySelector(".QuestionHeader-title").innerText;
    // 问所需的字段
    feedUrl = jsonData["initialState"]["question"]["answers"][questionId]["next"];

    document.querySelectorAll(".List-item").forEach(function (item, index) {
        // 找到meta标签itemprop="url"的content值
        var answerUrl = item.querySelector("meta[itemprop='url']").getAttribute("content");
        // https://www.zhihu.com/question/1353125863/answer/36206239923
        // 获取回答Id
        var answerId = answerUrl.split("/")[4];
        // 找到meta标签itemprop="name"的content值
        var author = item.querySelector("meta[itemprop='name']").getAttribute("content");
        var zan = parseInt(item.querySelector(".Button.VoteButton").getAttribute("aria-label").replace("赞同 ", ""));
        var mk = htmlToMarkdown(item.querySelector(".RichText.ztext.CopyrightRichText-richText").innerHTML);
        // console.log(mk);
        answerMap.set(answerId, {
                            "author": author,
                            "content": mk,
                            "zan": zan
       });
    })

    // 从初始URL开始递归调用
    recursiveFetch(questionName,currentPageUrl, [feedUrl])
}


async function recursiveFetch(questionName,questionUrl, urls, index = 0) {
    if (index >= urls.length) {
        // 所有地址都已请求完毕
        return;
    }

    try {
        const currentUrl = urls[index];
        console.log(`Fetching data from ${currentUrl}`);
        const data = await fetchData(currentUrl);

        // 处理当前请求的数据
        console.log(data);

        if(data && data["data"].length > 0){
            // 假设data.nextUrl是下一个请求的URL
            const nextUrl = data["paging"]["next"]
            if (nextUrl) {
                // 将下一个URL添加到URL列表中
                urls.push(nextUrl);
            }
            is_end = data["paging"]["is_end"];
            currentPage = parseInt(data["paging"]["page"]);
            console.log(currentPage + ":" +is_end);
        }else{
            is_end = true;
        }
        
        // 超过xx页就停止循环
        if (currentPage >= 100 || is_end) {
            // 这里统一存储数据
            console.log("size:" +answerMap.size);
            var answerMapArray = Array.from(answerMap.values());
            answerMapArray.sort(function (a, b) {
                return new Date(b["zan"]) - new Date(a["zan"]);
            });

            var str = "";
            // 遍历questionMapArray，获取title和questionUrl
            answerMapArray.forEach(function (item, index) {
                str += `## ${item.author} [${item.zan}]\n`
                str += `${item.content}`
                str += `\n  --- \n`
            })
            // 创建一个json对象
            var json = {
                "notebook": notebook,
                "path": `/知乎/` + questionName + "[" + answerMapArray.length + "]",
                "markdown": str
            }
            // 调用思源创建文档api
            await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd", json)
            document.getElementById("CRX-container-button").innerText = "抓取完成";
            return;
        }else{
            document.getElementById("CRX-container-button").innerText = "调用：" + urls.length;
        }
        // 遍历data
        const dataList = data["data"];
        console.log(dataList);
        // 遍历dataList，这里假设它是一个数组
        if (Array.isArray(dataList)) {
            dataList.forEach((item, index) => {
                if (item["target_type"] == "answer") {
                    // 读取id  用来去重
                    var answerId = item["target"]["id"];
                    // 点赞数
                    var zan = parseInt(item["target"]["voteup_count"]);
                    if (zan > 10) {
                        console.log("zan is " + zan);
                        var mk = htmlToMarkdown(`${item["target"]["content"]}`);

                        answerMap.set(answerId, {
                            "author": item["target"]["author"]["name"],
                            "content": mk,
                            "zan": zan
                        });
                    }
                }
            });
        }
        // 递归调用以处理下一个URL
        await recursiveFetch(questionName,questionUrl, urls, index + 1);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


async function recursiveFetchTopicQuestion(topicName, urls, index = 0) {
    if (index >= urls.length) {
        // 所有地址都已请求完毕
        return;
    }

    try {
        const currentUrl = urls[index];
        console.log(`Fetching data from ${currentUrl}`);
        const data = await fetchData(currentUrl);

        // 处理当前请求的数据
        console.log(data);

        if(data["data"].length > 0){
            // 假设data.nextUrl是下一个请求的URL
            const nextUrl = data["paging"]["next"]
            if (nextUrl) {
                // 将下一个URL添加到URL列表中
                urls.push(nextUrl);
            }
            is_end = data["paging"]["is_end"];
            currentPage = parseInt(data["paging"]["page"]);
        }else{
            is_end = true;
        }

        // alert(currentPage);
        // 超过xx页就停止循环
        if (urls.length > 100 || is_end || data["data"].length == 0) {
            // 这里进行数据存储
            // alert(questionMap.size);
            // console.log(questionMap.values());
            // - 1、[外交部称「美方虚化掏空一中原则怂恿支持『台独』分裂活动，将使美国承担难以承受的代价」，释放什么信号？](https://www.zhihu.com/question/534508482)\n- 2、[外交部称「美方虚化掏空一中原则怂恿支持『台独』分裂活动，将使美国承担难以承受的代价」，释放什么信号？](https://www.zhihu.com/question/534508482)

            // 遍历questionMap.values() 根据createTime排序
            var questionMapArray = Array.from(questionMap.values());
            questionMapArray.sort(function (a, b) {
                return new Date(b["createTime"]) - new Date(a["createTime"]);
            });

            console.log(questionMapArray);

            var str = "";
            // 遍历questionMapArray，获取title和questionUrl
            questionMapArray.forEach(function (item, index) {
                str += `- ${item.createTime} [${item.title}]`
                str += `(${item.questionUrl}) `
                str += `\n`
            })

            // 创建一个json对象
            var json = {
                "notebook": notebook,
                "path": "/知乎/" + topicName + "[" + questionMapArray.length + "]",
                "markdown": str
            }
            // 调用思源创建文档api
            await invokeSiyuanApi("http://127.0.0.1:6806/api/filetree/createDocWithMd", json)
            document.getElementById("CRX-container-button").innerText = "抓取完成";
            return;
        } else {
            // 更新进度
            document.getElementById("CRX-container-button").innerText = "调用：" + urls.length;
        }
        // 遍历data
        const dataList = data["data"];
        console.log(dataList);

        // 遍历dataList，这里假设它是一个数组
        if (Array.isArray(dataList)) {
            dataList.forEach((item, index) => {
                if (item["type"] == "topic_feed" && item["target"]["answer_type"] == "NORMAL") {
                    // 读取id  用来去重
                    var questionId = item["target"]["question"]["id"];
                    //  https://www.zhihu.com/question/591337909
                    questionUrl = "https://www.zhihu.com/question/" + questionId;
                    title = item["target"]["question"]["title"];
                    // 把1546078223这个格式转换成2019-04-13,月和日也要是两位数的，比如'04-13'  这个格式
                    createTime = formatDate(new Date(parseInt(item["target"]["question"]["created_time"]) * 1000));
                    questionMap.set(questionId, {
                        "questionUrl": questionUrl,
                        "title": title,
                        "createTime": createTime
                    });
                }
            });
        }

        // 递归调用以处理下一个URL
        await recursiveFetchTopicQuestion(topicName, urls, index + 1);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，所以需要+1
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function htmlToMarkdown(html) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');
    let markdown = '';
    let paragraphs = doc.querySelectorAll('p');
    for (let p of paragraphs) {
        markdown += p.textContent + '\n\n';
    }
    let uls = doc.querySelectorAll('ul');
    for (let ul of uls) {
        markdown += '\n';
        let lis = ul.querySelectorAll('li');
        for (let li of lis) {
            markdown += '- ' + li.textContent + '\n';
        }
        markdown += '\n';
    }
    let ols = doc.querySelectorAll('ol');
    let index = 1;
    for (let ol of ols) {
        markdown += '\n';
        let lis = ol.querySelectorAll('li');
        for (let li of lis) {
            markdown += index + '. ' + li.textContent + '\n';
            index++;
        }
        markdown += '\n';
    }
    return markdown;
}