document.getElementById('config-form').addEventListener('submit', function(event) {
  event.preventDefault();
  var token = document.getElementById('token').value;
  // 去掉空格
  token = token.replace(/\s/g, '');
  var notebook = document.getElementById('notebook').value;
  var pageTemplateUrl = document.getElementById('pageTemplateUrl').value;
  // 去掉pageTemplateUrl空格
  pageTemplateUrl = pageTemplateUrl.replace(/\s/g, '');
  chrome.storage.local.set({ token: token, notebook: notebook, pageTemplateUrl: pageTemplateUrl }, function() {
    console.log(notebook, pageTemplateUrl, token);
  });
});


document.addEventListener('DOMContentLoaded', function() {
    // 当DOM完全加载后执行
    const form = document.getElementById('config-form');
    const tokenInput = document.getElementById('token');
    const notebookSelect = document.getElementById('notebook');
    const pageTemplateUrlInput = document.getElementById('pageTemplateUrl');
  
    // 从chrome.storage.local获取数据
    chrome.storage.local.get(['token', 'notebook', 'pageTemplateUrl'], function(result) {
      // 检查并设置token
      if (result.token) {
        tokenInput.value = result.token;
        // 获取所有笔记本的列表
        // 然后根据返回的notebook列表填充notebookSelect的选项
        fetch('http://127.0.0.1:6806/api/notebook/lsNotebooks', {
          method: 'POST',
          headers: {
              "Authorization": "token "+result.token,
              "Content-Type": "application/json",
          },
          body: JSON.stringify({})
          })
       .then(response => response.json())
       .then(data => {
            console.log('Fetched notebook list:', data.data.notebooks);
            notebookSelect.innerHTML = '<option value="">请选择笔记本</option>';
            data.data.notebooks.forEach(notebook => {
              var option = document.createElement('option');
              option.value = notebook.id;
              option.text = notebook.name;
              if (result.notebook) {
                if (option.value === result.notebook) {
                    option.selected = true;
                }
              }
              notebookSelect.appendChild(option);
            });
      })
      }
      
      // 检查并设置页面模板URL
      if (result.pageTemplateUrl) {
        pageTemplateUrlInput.value = result.pageTemplateUrl;
      }
    })
    // 如果需要，还可以添加表单提交事件的处理逻辑
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // 阻止表单的默认提交行为
      // 收集数据并保存到chrome.storage.local或其他需要的操作
    });
});


document.getElementById('token').addEventListener('change', function(event) {
    var token = event.target.value;
    if (token) {
        // 去掉空格
        token = token.replace(/\s/g, '');
        // 清理之前的笔记本列表
        var notebookSelect = document.getElementById('notebook');
        notebookSelect.innerHTML = '<option value="">请选择笔记本</option>';
      // 发起请求到思源笔记的 API，获取笔记本列表
      fetch('http://127.0.0.1:6806/api/notebook/lsNotebooks', {
        method: 'POST',
        headers: {
            "Authorization": "token "+token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({})
      })
     .then(response => response.json())
     .then(data => {
        console.log('Fetched notebook list:', data.data.notebooks);
        var notebookSelect = document.getElementById('notebook');
        notebookSelect.innerHTML = '<option value="">请选择笔记本</option>';
        data.data.notebooks.forEach(notebook => {
          var option = document.createElement('option');
          option.value = notebook.id;
          option.text = notebook.name;
          notebookSelect.appendChild(option);
        });
      })
     .catch(error => {
        console.error('Error fetching notebook list:', error);
      });
    } else {
      var notebookSelect = document.getElementById('notebook');
      notebookSelect.innerHTML = '<option value="">请选择笔记本</option>';
    }
});
  
  