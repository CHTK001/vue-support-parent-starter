/**
 * useCompositionInput — 输入框回车发送手势判断
 *
 * 支持 Shift+Enter 换行、Enter 发送的常见配置。
 * 返回发送键组合判断函数。
 */
import { KeyboardEvent, useState } from 'react';

export type SendKeyMode = 'enter' | 'modEnter';

/**
 * 判断当前键盘事件是否为"发送"手势。
 * - sendKey === 'enter': Enter (无 Shift) 发送
 * - sendKey === 'modEnter': Ctrl/Cmd + Enter 发送
 */
export function isSubmitGesture(e: KeyboardEvent, sendKey: SendKeyMode): boolean {
  if (sendKey === 'enter') {
    return e.key === 'Enter' && !e.shiftKey;
  }
  // modEnter: Ctrl（Windows/Linux）或 Cmd（Mac） + Enter
  return e.key === 'Enter' && (e.ctrlKey || e.metaKey);
}

/**
 * React hook：管理输入框的受控值 + 组合输入状态。
 * （当前 BotIM 页面自绘输入框未直接使用此 hook，
 *  但其类型导出 isSubmitGesture / SendKeyMode 供页面消费。）
 */
export function useCompositionInput(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const [composing, setComposing] = useState(false);
  const [compositionStr, setCompositionStr] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleComposition = (e: React.CompositionEvent) => {
    if (e.type === 'start') {
      setComposing(true);
    } else if (e.type === 'end') {
      setComposing(false);
      setCompositionStr(e.currentTarget.value);
    }
  };

  return { value, setValue, composing, compositionStr, handleChange, handleComposition };
}
