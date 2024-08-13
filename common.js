var currentPageUrl;
const pageTemplateUrl = "F:\\思源笔记\\data\\templates\\视频笔记模版.md"
const Authorization = "token 4si8l21oy72gng6e"
const notebook = "20240113225127-jsmsoov"

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