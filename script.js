// DOM元素
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const resizer = document.getElementById('resizer');
const editorContainer = document.querySelector('.editor-container');
const previewContainer = document.querySelector('.preview-container');
const wordCount = document.getElementById('wordCount');
const syncStatus = document.getElementById('syncStatus');
const syntaxHint = document.getElementById('syntaxHint');
const syntaxCard = document.getElementById('syntaxCard');
const closeSyntaxCard = document.getElementById('closeSyntaxCard');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const newBtn = document.getElementById('newBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const pasteBtn = document.getElementById('pasteBtn');
const copyPreviewBtn = document.getElementById('copyPreviewBtn');
const printBtn = document.getElementById('printBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileNewBtn = document.getElementById('mobileNewBtn');
const mobileSaveBtn = document.getElementById('mobileSaveBtn');
const mobileClearBtn = document.getElementById('mobileClearBtn');
const toolbarButtons = document.querySelectorAll('.toolbar-btn');

// 初始化变量
let isResizing = false;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let isFullscreen = false;
let fullscreenMode = 'both'; // 'editor', 'preview', 'both'
let lastSyncTime = new Date();
let markdownContent = localStorage.getItem('markdownContent') || '';

// 初始化编辑器
function initEditor() {
  // 设置初始内容
  editor.value = markdownContent;
  
  // 渲染预览
  renderPreview();
  
  // 更新字数统计
  updateWordCount();
  
  // 设置主题
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
    themeToggleBtn.innerHTML = '<i class="fa fa-sun-o mr-1"></i> 亮色模式';
  }
  
  // 设置事件监听器
  setupEventListeners();
  
  // 显示欢迎提示
  showNotification('欢迎使用Markdown编辑器！', 3000);
}

// 设置事件监听器
function setupEventListeners() {
  // 编辑器输入事件
  editor.addEventListener('input', debounce(function() {
    markdownContent = editor.value;
    renderPreview();
    updateWordCount();
    saveToLocalStorage();
    updateSyncStatus(true);
  }, 100));
  
  // 窗口大小改变事件
  window.addEventListener('resize', debounce(function() {
    if (!isResizing) {
      adjustLayout();
    }
  }, 100));
  
  // 调整大小事件
  resizer.addEventListener('mousedown', startResizing);
  resizer.addEventListener('touchstart', startResizing, { passive: false });
  
  // 语法提示事件
  syntaxHint.addEventListener('click', toggleSyntaxCard);
  closeSyntaxCard.addEventListener('click', toggleSyntaxCard);
  
  // 主题切换事件
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  // 全屏切换事件
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  
  // 新建按钮事件
  newBtn.addEventListener('click', createNewDocument);
  mobileNewBtn.addEventListener('click', createNewDocument);
  
  // 保存按钮事件
  saveBtn.addEventListener('click', saveDocument);
  mobileSaveBtn.addEventListener('click', saveDocument);
  
  // 清空按钮事件
  clearBtn.addEventListener('click', clearDocument);
  mobileClearBtn.addEventListener('click', clearDocument);
  
  // 复制按钮事件
  copyBtn.addEventListener('click', copyToClipboard);
  
  // 粘贴按钮事件
  pasteBtn.addEventListener('click', pasteFromClipboard);
  
  // 复制预览按钮事件
  copyPreviewBtn.addEventListener('click', copyPreviewToClipboard);
  
  // 打印按钮事件
  printBtn.addEventListener('click', printDocument);
  
  // 移动端菜单事件
  mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  
  // 工具栏按钮事件
  toolbarButtons.forEach(button => {
    button.addEventListener('click', function() {
      const command = this.dataset.command;
      const value = this.dataset.value;
      executeCommand(command, value);
    });
  });
  
  // 键盘快捷键
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveDocument();
    }
    
    // Ctrl/Cmd + N 新建
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createNewDocument();
    }
    
    // Ctrl/Cmd + / 显示/隐藏语法提示
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      toggleSyntaxCard();
    }
  });
}

// 渲染预览
function renderPreview() {
  // 使用marked解析Markdown
  const html = marked.parse(markdownContent);
  preview.innerHTML = html;
  
  // 代码高亮
  document.querySelectorAll('#preview pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
}

// 更新字数统计
function updateWordCount() {
  const text = editor.value.trim();
  const count = text.length;
  wordCount.textContent = `字数: ${count}`;
}

// 保存到本地存储
function saveToLocalStorage() {
  localStorage.setItem('markdownContent', markdownContent);
  localStorage.setItem('lastSaved', new Date().toISOString());
  lastSyncTime = new Date();
}

// 更新同步状态
function updateSyncStatus(isSynced) {
  if (isSynced) {
    syncStatus.innerHTML = '<i class="fa fa-check-circle text-green-500 mr-1"></i><span>已同步</span>';
  } else {
    syncStatus.innerHTML = '<i class="fa fa-spinner fa-spin text-yellow-500 mr-1"></i><span>同步中...</span>';
  }
}

// 开始调整大小
function startResizing(e) {
  e.preventDefault();
  isResizing = true;
  
  document.addEventListener('mousemove', resize);
  document.addEventListener('touchmove', resize, { passive: false });
  document.addEventListener('mouseup', stopResizing);
  document.addEventListener('touchend', stopResizing);
}

// 调整大小
function resize(e) {
  if (!isResizing) return;
  
  const container = document.querySelector('main');
  const containerRect = container.getBoundingClientRect();
  
  let x, width;
  
  if (e.type === 'touchmove') {
    x = e.touches[0].clientX;
  } else {
    x = e.clientX;
  }
  
  // 计算宽度比例
  width = (x - containerRect.left) / containerRect.width * 100;
  
  // 限制最小宽度
  if (width < 20) width = 20;
  if (width > 80) width = 80;
  
  // 设置宽度
  editorContainer.style.width = `${width}%`;
  previewContainer.style.width = `${100 - width}%`;
}

// 停止调整大小
function stopResizing() {
  isResizing = false;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('touchmove', resize);
  document.removeEventListener('mouseup', stopResizing);
  document.removeEventListener('touchend', stopResizing);
}

// 调整布局
function adjustLayout() {
  const container = document.querySelector('main');
  const containerRect = container.getBoundingClientRect();
  
  const editorWidth = editorContainer.offsetWidth;
  const previewWidth = previewContainer.offsetWidth;
  
  const editorPercentage = (editorWidth / containerRect.width) * 100;
  const previewPercentage = (previewWidth / containerRect.width) * 100;
  
  editorContainer.style.width = `${editorPercentage}%`;
  previewContainer.style.width = `${previewPercentage}%`;
}

// 切换语法提示卡片
function toggleSyntaxCard() {
  syntaxCard.classList.toggle('hidden');
}

// 切换主题切换
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.documentElement.classList.toggle(isDarkMode ? 'add' : 'remove')('dark');
  localStorage.setItem('darkMode', isDarkMode);
  
  themeToggleBtn.innerHTML = isDarkMode 
    ? '<i class="fa fa-sun-o mr-1"></i> 亮色模式' 
    : '<i class="fa fa-moon-o mr-1"></i> 暗色模式';
  
  // 重新渲染预览以适应主题
  renderPreview();
}

// 切换全屏
function toggleFullscreen() {
  isFullscreen = !isFullscreen;
  
  if (isFullscreen) {
    // 保存当前模式
    const editorWidth = parseInt(editorContainer.style.width) || 50;
    
    if (editorWidth > 70) {
      fullscreenMode = 'editor';
      editorContainer.classList.add('fullscreen');
      previewContainer.classList.add('hidden');
      resizer.classList.add('hidden');
    } else if (editorWidth < 30) {
      fullscreenMode = 'preview';
      previewContainer.classList.add('fullscreen');
      editorContainer.classList.add('hidden');
      resizer.classList.add('hidden');
    } else {
      fullscreenMode = 'both';
      editorContainer.classList.add('fullscreen');
      previewContainer.classList.add('fullscreen');
    }
    
    fullscreenBtn.innerHTML = '<i class="fa fa-compress mr-1"></i> 退出全屏';
  } else {
    // 恢复正常模式
    editorContainer.classList.remove('fullscreen', 'hidden');
    previewContainer.classList.remove('fullscreen', 'hidden');
    resizer.classList.remove('hidden');
    
    fullscreenBtn.innerHTML = '<i class="fa fa-expand mr-1"></i> 全屏';
  }
}

// 新建文档
function createNewDocument() {
  if (editor.value.trim() !== '') {
    if (!confirm('确定要创建新文档吗？当前内容将被清空。')) {
      return;
    }
  }
  
  editor.value = '';
  markdownContent = '';
  renderPreview();
  updateWordCount();
  saveToLocalStorage();
  showNotification('已创建新文档');
}

// 保存文档
function saveDocument() {
  // 创建Blob对象
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // 设置文件名
  const now = new Date();
  const dateString = now.toISOString().slice(0, 10);
  a.download = `markdown-${dateString}.md`;
  
  // 触发下载
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
  
  showNotification('文档已保存');
}

// 清空文档
function clearDocument() {
  if (editor.value.trim() === '') {
    showNotification('文档已为空');
    return;
  }
  
  if (!confirm('确定要清空文档吗？')) {
    return;
  }
  
  editor.value = '';
  markdownContent = '';
  renderPreview();
  updateWordCount();
  saveToLocalStorage();
  showNotification('文档已清空');
}

// 复制到剪贴板
function copyToClipboard() {
  editor.select();
  document.execCommand('copy');
  
  // 取消选择
  window.getSelection().removeAllRanges();
  
  showNotification('内容已复制到剪贴板');
}

// 从剪贴板粘贴
function pasteFromClipboard() {
  navigator.clipboard.readText()
    .then(text => {
      editor.value += text;
      markdownContent = editor.value;
      renderPreview();
      updateWordCount();
      saveToLocalStorage();
      showNotification('内容已从剪贴板粘贴');
    })
    .catch(err => {
      console.error('无法读取剪贴板内容: ', err);
      showNotification('无法读取剪贴板内容', 3000, 'error');
    });
}

// 复制预览内容到剪贴板
function copyPreviewToClipboard() {
  const range = document.createRange();
  range.selectNode(preview);
  window.getSelection().addRange(range);
  
  document.execCommand('copy');
  
  // 取消选择
  window.getSelection().removeAllRanges();
  
  showNotification('预览内容已复制到剪贴板');
}

// 打印文档
function printDocument() {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Markdown 预览</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; padding: 2rem; }
          h1, h2, h3, h4, h5, h6 { margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600; }
          h1 { font-size: 2rem; border-bottom: 1px solid #eaecef; padding-bottom: 0.3rem; }
          h2 { font-size: 1.5rem; border-bottom: 1px solid #eaecef; padding-bottom: 0.3rem; }
          h3 { font-size: 1.25rem; }
          p { margin-bottom: 1rem; }
          ul, ol { margin-left: 2rem; margin-bottom: 1rem; }
          ul { list-style-type: disc; }
          ol { list-style-type: decimal; }
          li { margin-bottom: 0.5rem; }
          a { color: #0366d6; text-decoration: none; }
          a:hover { text-decoration: underline; }
          blockquote { padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; margin-bottom: 1rem; }
          pre { background-color: #f6f8fa; border-radius: 3px; padding: 1rem; margin-bottom: 1rem; overflow-x: auto; }
          code { font-family: 'Fira Code', monospace; font-size: 0.9rem; padding: 0.2em 0.4em; margin: 0; background-color: rgba(27, 31, 35, 0.05); border-radius: 3px; }
          pre code { background-color: transparent; padding: 0; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
          th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eaecef; }
          th { font-weight: 600; background-color: #f6f8fa; }
          img { max-width: 100%; border-radius: 4px; margin: 1rem 0; }
        </style>
      </head>
      <body>
        ${preview.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// 切换移动端菜单
function toggleMobileMenu() {
  mobileMenu.classList.toggle('hidden');
}

// 执行工具栏命令
function executeCommand(command, value) {
  const selectionStart = editor.selectionStart;
  const selectionEnd = editor.selectionEnd;
  const selectedText = editor.value.substring(selectionStart, selectionEnd);
  let newText = '';
  let cursorPosition = 0;
  
  switch (command) {
    case 'heading':
      // 检查是否已经是标题
      const lines = editor.value.split('\n');
      const currentLine = lines.findIndex((_, index, arr) => {
        const start = arr.slice(0, index).join('\n').length + 1;
        const end = start + arr[index].length;
        return selectionStart >= start && selectionStart <= end;
      });
      
      if (currentLine !== -1) {
        const line = lines[currentLine];
        const headingMatch = line.match(/^(#+\s)/);
        
        if (headingMatch) {
          // 如果已经是标题，更新标题级别
          lines[currentLine] = line.replace(headingMatch[1], '#'.repeat(parseInt(value)) + ' ');
        } else {
          // 如果不是标题，添加标题标记
          lines[currentLine] = '#'.repeat(parseInt(value)) + ' ' + line;
        }
        
        newText = lines.join('\n');
        cursorPosition = selectionStart;
      } else {
        // 如果没有选中任何行，在光标位置添加标题
        newText = editor.value.substring(0, selectionStart) + 
                  '#'.repeat(parseInt(value)) + ' ' + 
                  editor.value.substring(selectionStart);
        cursorPosition = selectionStart + parseInt(value) + 1;
      }
      break;
      
    case 'bold':
      newText = editor.value.substring(0, selectionStart) + 
                '**' + selectedText + '**' + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart + 2;
      break;
      
    case 'italic':
      newText = editor.value.substring(0, selectionStart) + 
                '*' + selectedText + '*' + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart + 1;
      break;
      
    case 'strikethrough':
      newText = editor.value.substring(0, selectionStart) + 
                '~~' + selectedText + '~~' + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart + 2;
      break;
      
    case 'ul':
      // 处理列表
      const ulLines = selectedText.split('\n');
      const newUlLines = ulLines.map(line => {
        if (line.trim() !== '') {
          return line.match(/^(\s*)-\s/) ? line : '  - ' + line;
        }
        return line;
      });
      
      newText = editor.value.substring(0, selectionStart) + 
                newUlLines.join('\n') + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart;
      break;
      
    case 'ol':
      // 处理有序列表
      const olLines = selectedText.split('\n');
      const newOlLines = olLines.map((line, index) => {
        if (line.trim() !== '') {
          return line.match(/^(\s*)\d+\.\s/) ? line : '  ' + (index + 1) + '. ' + line;
        }
        return line;
      });
      
      newText = editor.value.substring(0, selectionStart) + 
                newOlLines.join('\n') + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart;
      break;
      
    case 'link':
      if (selectedText) {
        // 如果有选中的文本，创建链接
        newText = editor.value.substring(0, selectionStart) + 
                  `[${selectedText}](https://example.com)` + 
                  editor.value.substring(selectionEnd);
        cursorPosition = selectionStart + selectedText.length + 4; // 移动到链接地址部分
      } else {
        // 如果没有选中的文本，插入链接模板
        newText = editor.value.substring(0, selectionStart) + 
                  '[链接文本](https://example.com)' + 
                  editor.value.substring(selectionEnd);
        cursorPosition = selectionStart + 4; // 移动到链接文本部分
      }
      break;
      
    case 'image':
      if (selectedText) {
        // 如果有选中的文本，创建图片
        newText = editor.value.substring(0, selectionStart) + 
                  `![${selectedText}](https://example.com/image.jpg)` + 
                  editor.value.substring(selectionEnd);
        cursorPosition = selectionStart + selectedText.length + 5; // 移动到图片地址部分
      } else {
        // 如果没有选中的文本，插入图片模板
        newText = editor.value.substring(0, selectionStart) + 
                  '![图片描述](https://example.com/image.jpg)' + 
                  editor.value.substring(selectionEnd);
        cursorPosition = selectionStart + 5; // 移动到图片描述部分
      }
      break;
      
    case 'code':
      if (selectedText) {
        // 如果有选中的文本，创建行内代码
        newText = editor.value.substring(0, selectionStart) + 
                  '`' + selectedText + '`' + 
                  editor.value.substring(selectionEnd);
        cursorPosition = selectionStart + 1;
      } else {
        // 如果没有选中的文本，插入代码模板
        newText = editor.value.substring(0, selectionStart) + 
                  '`代码`' + 
                  editor.value.substring(selectionEnd);
        cursorPosition = selectionStart + 1; // 移动到代码部分
      }
      break;
      
    case 'codeblock':
      // 创建代码块
      newText = editor.value.substring(0, selectionStart) + 
                '```javascript\n' + selectedText + '\n```' + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart + 12; // 移动到代码块内部
      break;
      
    case 'table':
      // 创建表格
      const table = `| 表头1 | 表头2 | 表头3 |
| --- | --- | --- |
| 单元格1 | 单元格2 | 单元格3 |
| 单元格4 | 单元格5 | 单元格6 |`;
      
      newText = editor.value.substring(0, selectionStart) + 
                table + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart + table.length;
      break;
      
    case 'hr':
      // 创建水平线
      newText = editor.value.substring(0, selectionStart) + 
                '\n---\n' + 
                editor.value.substring(selectionEnd);
      cursorPosition = selectionStart + 4;
      break;
  }
  
  // 更新编辑器内容
  editor.value = newText;
  markdownContent = newText;
  
  // 设置光标位置
  editor.focus();
  editor.selectionStart = cursorPosition;
  editor.selectionEnd = cursorPosition;
  
  // 更新预览
  renderPreview();
  updateWordCount();
  saveToLocalStorage();
}

// 显示通知
function showNotification(text, duration = 2000, type = 'success') {
  notificationText.textContent = text;
  
  // 设置通知类型
  notification.className = notification.className.replace(/bg-\w+-\d+/g, '');
  if (type === 'error') {
    notification.classList.add('bg-red-500');
  } else if (type === 'warning') {
    notification.classList.add('bg-yellow-500');
  } else {
    notification.classList.add('bg-green-500');
  }
  
  // 显示通知
  notification.classList.add('show');
  
  // 自动隐藏
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// 页面加载完成后初始化编辑器
document.addEventListener('DOMContentLoaded', initEditor);
