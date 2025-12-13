import { onMounted, onUnmounted } from 'vue';

/**
 * 快捷键支持 Composable
 * @param {Object} options 配置选项
 * @param {Function} options.onCopy 复制回调
 * @param {Function} options.onSelectAll 全选回调
 * @param {Function} options.onDelete 删除回调
 * @param {Function} options.onEnter Enter键回调
 * @param {Function} options.onEscape ESC键回调
 * @param {Function} options.onTab Tab键回调
 * @param {Function} options.onArrowUp 上箭头回调
 * @param {Function} options.onArrowDown 下箭头回调
 * @param {Function} options.onArrowLeft 左箭头回调
 * @param {Function} options.onArrowRight 右箭头回调
 * @param {Boolean} options.enabled 是否启用快捷键
 * @param {Object} options.customKeys 自定义快捷键映射
 */
export function useKeyboard(options = {}) {
  const {
    onCopy,
    onSelectAll,
    onDelete,
    onEnter,
    onEscape,
    onTab,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    enabled = true,
    customKeys = {}
  } = options;

  /**
   * 判断是否是Mac系统
   */
  const isMac = () => {
    return /macintosh|mac os x/i.test(navigator.userAgent);
  };

  /**
   * 获取修饰键
   */
  const getModifierKey = (event) => {
    return isMac() ? event.metaKey : event.ctrlKey;
  };

  /**
   * 键盘事件处理器
   */
  const handleKeyDown = (event) => {
    if (!enabled) return;

    // 如果焦点在输入框内,忽略快捷键
    const tagName = event.target.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tagName)) {
      return;
    }

    const modifier = getModifierKey(event);
    const { key, keyCode, shiftKey, altKey } = event;

    // Ctrl/Cmd + C - 复制
    if (modifier && key === 'c' && onCopy) {
      event.preventDefault();
      onCopy(event);
      return;
    }

    // Ctrl/Cmd + A - 全选
    if (modifier && key === 'a' && onSelectAll) {
      event.preventDefault();
      onSelectAll(event);
      return;
    }

    // Delete/Backspace - 删除
    if ((key === 'Delete' || key === 'Backspace') && onDelete) {
      event.preventDefault();
      onDelete(event);
      return;
    }

    // Enter - 确认/编辑
    if (key === 'Enter' && onEnter) {
      event.preventDefault();
      onEnter(event);
      return;
    }

    // ESC - 取消
    if (key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape(event);
      return;
    }

    // Tab - 切换焦点
    if (key === 'Tab' && onTab) {
      event.preventDefault();
      onTab(event, shiftKey);
      return;
    }

    // Arrow Keys - 导航
    if (key === 'ArrowUp' && onArrowUp) {
      event.preventDefault();
      onArrowUp(event);
      return;
    }

    if (key === 'ArrowDown' && onArrowDown) {
      event.preventDefault();
      onArrowDown(event);
      return;
    }

    if (key === 'ArrowLeft' && onArrowLeft) {
      event.preventDefault();
      onArrowLeft(event);
      return;
    }

    if (key === 'ArrowRight' && onArrowRight) {
      event.preventDefault();
      onArrowRight(event);
      return;
    }

    // 处理自定义快捷键
    for (const [keyCombo, handler] of Object.entries(customKeys)) {
      if (matchKeyCombo(event, keyCombo)) {
        event.preventDefault();
        handler(event);
        return;
      }
    }
  };

  /**
   * 匹配快捷键组合
   */
  const matchKeyCombo = (event, combo) => {
    const parts = combo.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    
    const modifiers = {
      ctrl: event.ctrlKey,
      cmd: event.metaKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey
    };

    // 检查所有修饰键
    for (const part of parts.slice(0, -1)) {
      if (!modifiers[part]) {
        return false;
      }
    }

    // 检查按键
    return event.key.toLowerCase() === key;
  };

  /**
   * 复制选中内容到剪贴板
   */
  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return Promise.resolve();
    }
  };

  // 生命周期
  onMounted(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
    }
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return {
    copyToClipboard,
    isMac,
    getModifierKey
  };
}
