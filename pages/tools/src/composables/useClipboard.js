import { ref } from 'vue';
import { message } from '@repo/utils';

/**
 * 剪贴板操作 Hook
 * @returns {Object} 剪贴板操作方法
 */
export default function useClipboard() {
  const clipboardText = ref('');
  const copied = ref(false);
  const copyError = ref(null);

  /**
   * 将文本复制到剪贴板
   * @param {string} text 要复制的文本
   * @param {boolean} showSuccessMsg 是否显示成功消息提示，默认为 true
   * @returns {Promise<boolean>} 复制是否成功
   */
  const copyText = async (text, showSuccessMsg = false) => {
    try {
      if (!text) {
        throw new Error('没有要复制的内容');
      }

      if (navigator.clipboard && window.isSecureContext) {
        // 使用 Clipboard API (支持 HTTPS 或 localhost)
        await navigator.clipboard.writeText(text);
      } else {
        // 回退方法：使用 document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('复制失败');
        }
      }

      clipboardText.value = text;
      copied.value = true;
      copyError.value = null;
      
      if (showSuccessMsg) {
        message('已复制到剪贴板', { type: 'success' });
      }
      
      return true;
    } catch (error) {
      console.error('复制到剪贴板失败:', error);
      copied.value = false;
      copyError.value = error.message;
      
      message(`复制失败: ${error.message}`, { type: 'error' });
      return false;
    }
  };

  /**
   * 从剪贴板获取文本
   * @returns {Promise<string>} 剪贴板内容
   */
  const pasteText = async () => {
    try {
      let text = '';
      
      if (navigator.clipboard && window.isSecureContext) {
        // 使用 Clipboard API (支持 HTTPS 或 localhost)
        text = await navigator.clipboard.readText();
      } else {
        // 回退方法：使用 document.execCommand
        const activeElement = document.activeElement;
        const wasContentEditable = activeElement.contentEditable;
        const wasReadOnly = activeElement.readOnly;
        
        try {
          activeElement.contentEditable = true;
          activeElement.readOnly = false;
          
          // 尝试粘贴
          const result = document.execCommand('paste');
          
          if (!result) {
            throw new Error('粘贴失败 - 请检查浏览器权限');
          }
          
          text = activeElement.textContent || activeElement.value;
        } finally {
          activeElement.contentEditable = wasContentEditable;
          activeElement.readOnly = wasReadOnly;
        }
      }
      
      clipboardText.value = text;
      return text;
    } catch (error) {
      console.error('从剪贴板获取内容失败:', error);
      message(`获取剪贴板内容失败: ${error.message}`, { type: 'error' });
      return '';
    }
  };

  return {
    clipboardText,
    copied,
    copyError,
    copyText,
    pasteText
  };
} 