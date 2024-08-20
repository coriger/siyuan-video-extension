# 思源笔记：视频笔记插件

#### 1、下载最新Releases版本

#### 2、解压

- 找到`视频笔记模版.sy.zip`​文件，导入思源

- 把导入的文件`视频笔记模版`导出为模版

- 在思源的数据目录中找到`视频笔记模版.md`文件，拿到完整路径,替换`common.js`中`pageTemplateUrl`字段
​![image](assets/image-20240811070032-qh29h3n.png)​

- 打开思源笔记`设置-关于`菜单，找到`API token`，替换`common.js`中`Authorization`字段
​![image](assets/image-20240811070706-tvv2rxv.png)​

- 打开思源笔记网页端，只打开一个笔记本，`F12`打开开发者工具，`元素`菜单中搜索`b3-list b3-list--background`，边上`data-url`里的值替换`common.js`中`notebook`字段
  ![image](assets/image_03.png)

#### 3、进入Chrome扩展页面,加载插件文件夹并开启插件

#### 4、演示

- [B站](https://www.bilibili.com/video/BV1rdYfeLE87/)
- [百度网盘](https://www.bilibili.com/video/BV19QYqeBEgi)

#### 5、备注

- 本插件只适用于思源web端
- 目前支持B站、百度网盘、youtube视频数据的同步,需要支持其他站点的可以开issue提需求，或者自行二次开发
- 本插件开发主要是为自用，做不到充分的测试覆盖，如果使用出现任何异常请直接CTRL+F5强刷页面，基本可以100%解决问题，如果还是不行请开issue反馈
- 下载按钮因为网站前端各自缓存机制以及拦截机制的原因，可能会导致下载到之前的数据或者下载按钮无法显示，刷新页面或者切换分P即可
- 插件会持续优化，直到我觉得够用为止

#### 6、胡言乱语

- 之前有一个误区，非学科类的视频，知识密度低，通过看视频来学习效率不高，而且还要不断地停顿打时间戳做笔记就更效率低下
- 现在想通了，对于现在碎片化的时代，不管是耐心还是时间其实都没有太多机会让我们把焦点停留在一个地方太久，想要突破之前学习的困境，一个字就是要快，快到让自己还没觉得不耐烦之前就先完成一部分工作，这样才会有正反馈给到自己继续坚持下去，这样想来视频这方面确是一个不错的介入方式
- 目前正在拿红楼梦做实验，从B站找了一个最高赞的《红楼梦》解读合集
- 最初的操作是边看边打时间戳，非常不流畅，体验极差，速读很慢，不符合我前面说的快反馈，所以后面换了一种方式，就是1.5倍速看，看的过程只截图不做笔记，这样的话，一集30分钟，我大概20分钟可以看完，中间可能会有30-50个时间戳截图
- 第一遍快速看完之后，就开始回读时间戳，重新过一遍，过的时候会把这个时间戳的重点剧情或者人物写在时间戳的右侧，这样后面浏览大纲的时候就能快速的看到每个时间戳的核心剧情
- 遇到核心剧情或者人物的时间戳，这里会根据剧情或者自己的思考进行提问，发送给gpt，看一遍回答后把问题和答案复制在时间戳下面的笔记框中，每个笔记后面打上类似#AI问题#这样的标签，方便后续回顾，每个时间戳下面的编辑框中可以有多个问题，覆盖住这段时间戳的剧情即可
- 目前我看了前面两集，主要的核心时间戳，林黛玉进荣国府，这里我针对荣国府和宁国府进行了一些提问，然后是薛宝钗进贾府，这里讲到了红楼梦里的四大家族，也是一样通过gpt梳理了四大家族的人物关系以及它们之间的关联，还有林黛玉在遇到薛宝钗的一些语言表情片段，我觉得有点意思，所以针对她和薛宝钗的性格和故事线也进行了提问并了解
- 这样梳理下来，自己感觉还不错，全部都是基于自己的问题去学习，以往看视频大多都是被动的去接收观点，哪怕觉得不对也不会停下来思考，现在针对视频的每一帧都可以停下来进行反思，所以视频笔记也不像我之前说的没用
- 初步使用了下，觉得后续插件这方面应该会基于自己适用的工作流开发一些更便利的功能，比如提供一个一键批量截图的功能，比如间隔15s自动截图，这样的话我在看视频的视频就不需要自己手动点击了，后续在重读时间戳的时候，其实只需要关注自己关心的时间戳就行，给关注的时间戳提问题做笔记写标题，如果是特别重要的，可以在标题边上打上icon，这样在大纲里就一览无遗了
- 还有就是时间戳笔记区自动生成问题列表的模版，把问题填入之后支持一键发送到gpt窗口提交，后续笔记格式这块应该都会固定住，固定一种格式即可
- 然后读完一整套视频后，可以把之前重要的时间戳以及所有的AI问题全部汇总到一起，方便制卡复习和二次加工
- 这样一套下来对红楼梦有一个大概的了解后，再考虑去读原著或者其他红楼梦的著作，所以视频这块我是把它当做对某个领域入门的垫脚石，尽可能在较短的时间里做完一件事，至于好不好看个人体悟了
- 今天在使用的时候发现最好要加一个一件收缩的功能，或者一件精简的功能，把那些没有加上标题的时间戳快速隐藏，然后把时间戳惊醒收缩，收缩这个因为有大纲其实倒也还好，无效时间戳隐藏这个的确是可以搞一搞，这样后续复看的时候更有效率，甚至还可以搞一个页面时间戳自动播放，这样把这个笔记分享出去共享也是不错的，不过现阶段还是优先考虑自己的需要
- 昨夜在youtube看了一晚的红楼
- 感觉后续我用的最多的还是B站和youtube，视频嵌在页面体验会比多窗口体验好些，后续要是把视频笔记页分享出来这种连视频带笔记阅读起来也更方便
- 之前看到一个说法，学习不应该是痛苦的，如果感觉痛苦，这中间一定是有问题，其实问题也很简单，就是该弄明白的地方没弄明白，一个知识点还没搞明白，后面接二连三的又冒出一堆新的知识点，应接不暇，基础不牢，地动山摇啊，没有持续的正反馈，永远都是在补昨天的课，心累也是自然
- 这两天在看一门新语言，过去看文档真的是累，倒也不是看不懂，就是字太多，核心的东西被淹没在大量无效暂时不需要关注的信息里，等你找到了也心神俱疲，现在用ai直接从文档里梳理核心需求，然后再让它给我一个通俗易懂的案例，这样的确省心很多，所以学习还是要讲究效率，效率低，哪怕达到目的，也是不开心的
- 后续打断构思一个正反馈系统，充分的去迎合人性，人对于学习这件事，其实需求很简单，就是又要多又要快，然后还要有深度，多，其实好解决，手动筛选不花多少时间，怎么做到快，其实这个需要学习介质本身过硬，不废话直击重点，所以为什么说老师重要呢，要找对人学习，事半功倍，这样才能快，才有效率，至于深度，这个需要抠细节，反复思考总结验证
- 所以上面这个问题的核心在于，怎么找到优质的学习介质，找到好老师，然后去快速学习，快速实践，学习没压力，还能快速出成果，就像打游戏一样，一玩就上手，把把都牛逼，你说你读书要是学什么都快，怎么考都比别人好，这么正的反馈你还会觉得学习是一件痛苦的事嘛，简直就是一种享受
- 找对老师+快速实践=学习快乐，其实这一点对于很多领域都适用，靠自己去领悟还是太慢，甚至是不可能
