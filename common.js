var currentPageUrl;
var Authorization;
var notebook;
var pageTemplateUrl;

// 定义要从存储中检索的键
const keys = ['token', 'notebook', 'pageTemplateUrl'];

// 初始化函数，从存储中加载值
function initializeParams() {
    getValuesFromStorage(keys, function(result) {
        updateParams(result);
    });
}

// 更新参数值
function updateParams(values) {
    Authorization = values.token;
    notebook = values.notebook; 
    pageTemplateUrl = values.pageTemplateUrl;

    console.log('Authorization:', Authorization);
    console.log('notebook:', notebook);
    console.log('pageTemplateUrl:', pageTemplateUrl);
}

// 从存储中获取值的函数
function getValuesFromStorage(keys, callback) {
    chrome.storage.local.get(keys, function(result) {
        callback(result);
    });
}

// 监听存储变化，更新参数值
chrome.storage.onChanged.addListener(function(changes, namespace) {
    var changedValues = {};
    keys.forEach(function(key) {
        if (changes[key]) {
            changedValues[key] = changes[key].newValue;
        }
    });
    if (Object.keys(changedValues).length > 0) {
        updateParams(changedValues);
    }
});

// 调用初始化函数，加载初始值
initializeParams();

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
                "Authorization": "token "+Authorization,
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
                "Authorization": "token "+Authorization,
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

function parseStrFromTime(currentTime){
    var time = "00:00";
    if (currentTime && currentTime !== "" && currentTime > 0) {
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

async function fetchData(feedUrl) {
    try {
        const response = await fetch(feedUrl);
        // 确保响应状态码是2xx
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // 你可以继续处理响应，例如获取JSON数据
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}