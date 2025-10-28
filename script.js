document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const markdownInput = document.getElementById('markdown-input');
    const markdownPreview = document.getElementById('markdown-preview');
    const editorContainer = document.getElementById('editor-container');
    const resizer = document.getElementById('resizer');
    const wordCountEl = document.getElementById('word-count');
    const cursorPositionEl = document.getElementById('cursor-position');
    const previewModeEl = document.getElementById('preview-mode');
    const lastSavedEl = document.getElementById('last-saved');
    const newFileBtn = document.getElementById('new-file');
    const openFileBtn = document.getElementById('open-file');
    const saveFileBtn = document.getElementById('save-file');
    const exportHtmlBtn = document.getElementById('export-html');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const viewModeBtn = document.getElementById('view-mode');
    const fileInput = document.getElementById('file-input');
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');

    // 编辑器状态
    let viewMode = 'split'; // split, edit, preview
    let isDarkTheme = false;
    let lastSavedTime = '未保存';

    // 初始化mermaid配置
    mermaid.initialize({
        startOnLoad: false,
        theme: isDarkTheme ? 'dark' : 'default',
        flowchart: {
            useMaxWidth: false,
            htmlLabels: true
        }
    });

    // 配置marked解析器
    marked.setOptions({
        highlight: function(code, lang) {
            // 处理流程图和时序图
            if (lang === 'mermaid' || lang === 'flowchart' || lang === 'sequence') {
                return `<div class="mermaid">${code}</div>`;
            }
            
            // 代码高亮
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    // 渲染Markdown
    function renderMarkdown() {
        const markdown = markdownInput.value;
        const html = marked.parse(markdown);
        markdownPreview.innerHTML = html;
        
        // 渲染mermaid图表
        mermaid.init(undefined, markdownPreview.querySelectorAll('.mermaid'));
        
        // 更新字数统计
        updateWordCount();
    }

    // 更新字数统计
    function updateWordCount() {
        const text = markdownInput.value;
        const wordCount = text.length;
        wordCountEl.textContent = `字数: ${wordCount}`;
    }

    // 更新光标位置
    function updateCursorPosition() {
        const textarea = markdownInput;
        const line = textarea.value.substr(0, textarea.selectionStart).split('\n').length;
        const col = textarea.selectionStart - textarea.value.lastIndexOf('\n', textarea.selectionStart) - 1;
        cursorPositionEl.textContent = `行: ${line}, 列: ${col}`;
    }

    // 切换视图模式
    function toggleViewMode() {
        editorContainer.classList.remove(`view-mode-${viewMode}`);
        
        switch(viewMode) {
            case 'split':
                viewMode = 'edit';
                viewModeBtn.innerHTML = '<i class="fas fa-align-left"></i> 纯编辑';
                previewModeEl.textContent = '模式: 纯编辑';
                break;
            case 'edit':
                viewMode = 'preview';
                viewModeBtn.innerHTML = '<i class="fas fa-eye"></i> 纯预览';
                previewModeEl.textContent = '模式: 纯预览';
                break;
            case 'preview':
                viewMode = 'split';
                viewModeBtn.innerHTML = '<i class="fas fa-columns"></i> 分屏';
                previewModeEl.textContent = '模式: 分屏';
                break;
        }
        
        editorContainer.classList.add(`view-mode-${viewMode}`);
        renderMarkdown(); // 确保预览更新
    }

    // 切换主题
    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle('dark-theme', isDarkTheme);
        
        // 更新mermaid主题
        mermaid.initialize({
            theme: isDarkTheme ? 'dark' : 'default'
        });
        
        // 更新按钮图标
        themeToggleBtn.innerHTML = isDarkTheme ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        
        renderMarkdown(); // 重新渲染以应用主题
    }

    // 处理工具栏命令
    function handleToolbarCommand(command, value = '') {
        const textarea = markdownInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText = '';
        let cursorOffset = 0;

        switch(command) {
            case 'heading':
                const level = value;
                const prefix = '#'.repeat(level) + ' ';
                newText = prefix + selectedText;
                cursorOffset = prefix.length;
                break;
            case 'bold':
                newText = `**${selectedText || '粗体文本'}**`;
                cursorOffset = selectedText ? 0 : 4;
                break;
            case 'italic':
                newText = `*${selectedText || '斜体文本'}*`;
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'strikethrough':
                newText = `~~${selectedText || '删除线文本'}~~`;
                cursorOffset = selectedText ? 0 : 4;
                break;
            case 'ul':
                newText = `- ${selectedText || '列表项'}`;
                cursorOffset = selectedText ? 0 : 3;
                break;
            case 'ol':
                newText = `1. ${selectedText || '列表项'}`;
                cursorOffset = selectedText ? 0 : 3;
                break;
            case 'task':
                newText = `- [ ] ${selectedText || '任务项'}`;
                cursorOffset = selectedText ? 0 : 6;
                break;
            case 'quote':
                newText = `> ${selectedText || '引用文本'}`;
                cursorOffset = selectedText ? 0 : 2;
                break;
            case 'code':
                if (selectedText.includes('\n')) {
                    newText = '```javascript\n' + selectedText + '\n```';
                    cursorOffset = selectedText ? 0 : 13;
                } else {
                    newText = `\`${selectedText || '代码'}\``;
                    cursorOffset = selectedText ? 0 : 2;
                }
                break;
            case 'hr':
                newText = '\n---\n' + selectedText;
                cursorOffset = 0;
                break;
            case 'link':
                newText = `[${selectedText || '链接文本'}](https://example.com)`;
                cursorOffset = selectedText ? selectedText.length + 2 : 12;
                break;
            case 'image':
                newText = `![${selectedText || '图片描述'}](https://picsum.photos/800/400)`;
                cursorOffset = selectedText ? selectedText.length + 2 : 12;
                break;
            case 'table':
                newText = `| 表头1 | 表头2 | 表头3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n${selectedText}`;
                cursorOffset = 0;
                break;
            case 'flowchart':
                newText = '```mermaid\n' + 
                          'graph TD\n' +
                          '    A[开始] --> B{选择}\n' +
                          '    B -->|选项1| C[结果1]\n' +
                          '    B -->|选项2| D[结果2]\n' +
                          '    C --> E[结束]\n' +
                          '    D --> E\n' +
                          '```\n' + selectedText;
                cursorOffset = 0;
                break;
            case 'sequence':
                newText = '```mermaid\n' + 
                          'sequenceDiagram\n' +
                          '    参与者 A\n' +
                          '    参与者 B\n' +
                          '    A->>B: 发送消息\n' +
                          '    B->>A: 回复消息\n' +
                          '```\n' + selectedText;
                cursorOffset = 0;
                break;
        }

        // 替换选中内容并更新光标位置
        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
        
        // 触发渲染
        renderMarkdown();
        saveToLocalStorage();
    }

    // 新建文件
    function newFile() {
        if (markdownInput.value.trim() !== '' && !confirm('确定要新建文件吗？当前内容将被清空。')) {
            return;
        }
        markdownInput.value = '';
        renderMarkdown();
        saveToLocalStorage();
        updateLastSavedTime();
    }

    // 打开文件
    function openFile() {
        fileInput.click();
    }

    // 保存文件
    function saveFile() {
        const text = markdownInput.value;
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        updateLastSavedTime();
    }

    // 导出为HTML
    function exportHtml() {
        const markdown = markdownInput.value;
        const htmlContent = marked.parse(markdown);
        
        // 构建完整的HTML文档
        const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown导出文档</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/github.min.css">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.2.4/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        ${getMarkdownStyles()}
    </style>
</head>
<body>
    <div class="markdown-body">${htmlContent}</div>
    <script>
        mermaid.initialize({ startOnLoad: true });
        document.querySelectorAll('pre code').forEach((el) => {
            hljs.highlightElement(el);
        });
    </script>
</body>
</html>`;
        
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 获取Markdown预览样式
    function getMarkdownStyles() {
        // 提取CSS中与markdown-body相关的样式
        let styles = '';
        for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i];
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    if (rule.selectorText && rule.selectorText.includes('.markdown-body')) {
                        styles += rule.cssText + '\n';
                    }
                }
            } catch (e) {
                // 跨域样式表会抛出错误，忽略
            }
        }
        return styles;
    }

    // 从本地存储加载
    function loadFromLocalStorage() {
        const savedContent = localStorage.getItem('markdownEditorContent');
        if (savedContent) {
            markdownInput.value = savedContent;
            renderMarkdown();
        }
        
        const savedTheme = localStorage.getItem('markdownEditorTheme');
        if (savedTheme === 'dark') {
            isDarkTheme = true;
            document.body.classList.add('dark-theme');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        const savedMode = localStorage.getItem('markdownEditorMode');
        if (savedMode) {
            viewMode = savedMode;
            editorContainer.classList.remove('view-mode-split', 'view-mode-edit', 'view-mode-preview');
            editorContainer.classList.add(`view-mode-${viewMode}`);
            
            switch(viewMode) {
                case 'split':
                    viewModeBtn.innerHTML = '<i class="fas fa-columns"></i> 分屏';
                    previewModeEl.textContent = '模式: 分屏';
                    break;
                case 'edit':
                    viewModeBtn.innerHTML = '<i class="fas fa-align-left"></i> 纯编辑';
                    previewModeEl.textContent = '模式: 纯编辑';
                    break;
                case 'preview':
                    viewModeBtn.innerHTML = '<i class="fas fa-eye"></i> 纯预览';
                    previewModeEl.textContent = '模式: 纯预览';
                    break;
            }
        }
        
        const savedTime = localStorage.getItem('markdownEditorLastSaved');
        if (savedTime) {
            lastSavedTime = savedTime;
            lastSavedEl.textContent = `上次保存: ${lastSavedTime}`;
        }
    }

    // 保存到本地存储
    function saveToLocalStorage() {
        localStorage.setItem('markdownEditorContent', markdownInput.value);
        localStorage.setItem('markdownEditorTheme', isDarkTheme ? 'dark' : 'light');
        localStorage.setItem('markdownEditorMode', viewMode);
    }

    // 更新最后保存时间
    function updateLastSavedTime() {
        const now = new Date();
        lastSavedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        lastSavedEl.textContent = `上次保存: ${lastSavedTime}`;
        localStorage.setItem('markdownEditorLastSaved', lastSavedTime);
    }

    // 处理文件选择
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
            alert('请选择Markdown文件 (.md)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            markdownInput.value = e.target.result;
            renderMarkdown();
            saveToLocalStorage();
            updateLastSavedTime();
        };
        reader.readAsText(file);
        
        // 重置文件输入，允许再次选择同一个文件
        fileInput.value = '';
    }

    // 分屏调整
    function initResizer() {
        let startX, startWidth, startHeight;
        const editorPanel = document.querySelector('.editor-panel');
        const previewPanel = document.querySelector('.preview-panel');
        
        function startResize(e) {
            startX = e.pageX;
            startWidth = editorPanel.getBoundingClientRect().width;
            resizer.classList.add('active');
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        }
        
        function resize(e) {
            const width = startWidth + (e.pageX - startX);
            const containerWidth = editorContainer.getBoundingClientRect().width;
            
            // 限制最小宽度为20%
            if (width < containerWidth * 0.2 || width > containerWidth * 0.8) return;
            
            const editorPercent = (width / containerWidth) * 100;
            const previewPercent = 100 - editorPercent;
            
            editorPanel.style.flex = `0 0 ${editorPercent}%`;
            previewPanel.style.flex = `0 0 ${previewPercent}%`;
        }
        
        function stopResize() {
            resizer.classList.remove('active');
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
        
        resizer.addEventListener('mousedown', startResize);
    }

    // 键盘快捷键
    function handleKeyboardShortcuts(e) {
        // Ctrl+B: 粗体
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            handleToolbarCommand('bold');
        }
        // Ctrl+I: 斜体
        else if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            handleToolbarCommand('italic');
        }
        // Ctrl+Q: 引用
        else if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            handleToolbarCommand('quote');
        }
        // Ctrl+K: 代码块
        else if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            handleToolbarCommand('code');
        }
        // Ctrl+L: 链接
        else if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            handleToolbarCommand('link');
        }
        // Ctrl+U: 无序列表
        else if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            handleToolbarCommand('ul');
        }
        // Ctrl+O: 有序列表
        else if (e.ctrlKey && e.key === 'o' && !e.shiftKey) {
            e.preventDefault();
            handleToolbarCommand('ol');
        }
        // Ctrl+S: 保存
        else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveFile();
        }
        // Ctrl+N: 新建
        else if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            newFile();
        }
        // Ctrl+H+1-6: 标题1-6
        else if (e.ctrlKey && e.key === 'h') {
            const handleHeading = (key) => {
                if (key >= '1' && key <= '6') {
                    e.preventDefault();
                    handleToolbarCommand('heading', key);
                    document.removeEventListener('keydown', handleHeading);
                }
            };
            document.addEventListener('keydown', handleHeading);
        }
    }

    // 事件监听
    markdownInput.addEventListener('input', renderMarkdown);
    markdownInput.addEventListener('input', saveToLocalStorage);
    markdownInput.addEventListener('keydown', updateCursorPosition);
    markdownInput.addEventListener('keyup', updateCursorPosition);
    markdownInput.addEventListener('click', updateCursorPosition);
    
    viewModeBtn.addEventListener('click', toggleViewMode);
    themeToggleBtn.addEventListener('click', toggleTheme);
    newFileBtn.addEventListener('click', newFile);
    openFileBtn.addEventListener('click', openFile);
    saveFileBtn.addEventListener('click', saveFile);
    exportHtmlBtn.addEventListener('click', exportHtml);
    fileInput.addEventListener('change', handleFileSelect);
    
    toolbarButtons.forEach(button => {
        button.addEventListener('click', function() {
            const command = this.getAttribute('data-command');
            const value = this.getAttribute('data-value') || '';
            handleToolbarCommand(command, value);
        });
    });
    
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // 初始化
    initResizer();
    loadFromLocalStorage();
    updateCursorPosition();
    renderMarkdown();
});
    