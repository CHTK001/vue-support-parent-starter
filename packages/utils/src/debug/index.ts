import { addListener, crashBrowserCurrentTab, launch } from "devtools-detector";
const view = document.createElement("div");
document.body.appendChild(view);

export const loopDebugger = () => {
  (() => {
    function block() {
      setInterval(() => {
        (function () {
          return false;
        })
          ["constructor"]("debugger")
          ["call"]();
      }, 50);
    }
    try {
      block();
    } catch (err) {}
  })();
};

export const redirectDebugger = () => {
  // 1. 防止调试器检测
  addListener((isOpen) => {
    if (isOpen) {
      setTimeout(crashBrowserCurrentTab, 10);
      // 清除浏览器历史记录并跳转到百度
      if (window.history && window.history.replaceState) {
        // 清除当前页面的历史记录
        window.history.replaceState(null, '', 'about:blank');
        // 清除所有历史记录
        window.history.go(-(window.history.length - 1));
      }
      
      // 使用replace方式跳转，不会在历史记录中留下痕迹
      window.location.replace('https://www.baidu.com');
    }
  });
  
  // 2. 防止浏览器后退
  history.pushState(null, '', location.href);
  window.addEventListener('popstate', function(event) {
    history.pushState(null, '', location.href);
  });
  
  // 3. 防止页面刷新和常用快捷键
  document.addEventListener('keydown', function(e) {
    // 防止F5刷新
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+Shift+I (开发者工具)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    // 防止F12 (开发者工具)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+U (查看源代码)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+S (保存页面)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+A (全选)
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+P (打印)
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      return false;
    }
  });
  
  // 4. 防止右键菜单
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
  
  // 5. 防止文本选择
  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  });
  
  // 6. 防止拖拽
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });
  
  // 7. 监听页面可见性变化，防止切换标签页后返回
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      // 页面被隐藏时记录状态
      sessionStorage.setItem('pageHidden', 'true');
    } else {
      // 页面重新可见时检查
      if (sessionStorage.getItem('pageHidden') === 'true') {
        // 清除浏览器历史记录并跳转到百度
        if (window.history && window.history.replaceState) {
          // 清除当前页面的历史记录
          window.history.replaceState(null, '', 'about:blank');
          // 清除所有历史记录
          window.history.go(-(window.history.length - 1));
        }
        
        // 使用replace方式跳转，不会在历史记录中留下痕迹
        window.location.replace('https://www.baidu.com');
      }
    }
  });
  
  // 8. 防止通过历史记录API操作
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    // 确保始终有一个状态阻止后退
    setTimeout(() => {
      history.pushState(null, '', location.href);
    }, 0);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    // 确保始终有一个状态阻止后退
    setTimeout(() => {
      history.pushState(null, '', location.href);
    }, 0);
  };
  
  // 9. 启动调试器检测
  launch();
  
  // 10. 定期检查页面完整性
  setInterval(() => {
    // 检查关键DOM元素是否被篡改
    if (!document.body || !document.documentElement) {
      // 清除浏览器历史记录并跳转到百度
      if (window.history && window.history.replaceState) {
        // 清除当前页面的历史记录
        window.history.replaceState(null, '', 'about:blank');
        // 清除所有历史记录
        window.history.go(-(window.history.length - 1));
      }
      
      // 使用replace方式跳转，不会在历史记录中留下痕迹
      window.location.replace('https://www.baidu.com');
    }
  }, 1000);
};
