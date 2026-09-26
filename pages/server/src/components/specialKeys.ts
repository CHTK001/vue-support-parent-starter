/**
 * 远控「特殊按键」定义
 *
 * 浏览器与本机操作系统会优先截获部分组合键（Ctrl+Alt+Del 安全注意序列、
 * Alt+Tab、Win、Ctrl+Shift+Esc 等），这些按键无法通过键盘透传到被控端。
 * 这里把它们建模成「按键序列」，由远控工具条显式下发：
 *   先按顺序全部按下，再逆序全部松开（与 Guacamole/noVNC 屏幕键盘一致）。
 *
 * @author CH
 * @since 4.0.0
 */

/** 单个按键步骤 */
export interface SpecialKeyStep {
  /** X11 keysym（guacd 与 noVNC 均以此识别按键） */
  keysym: number;
  /** 物理键 code（noVNC QEMU 扩展键事件需要；guacd 忽略） */
  code?: string;
}

/** 一组特殊按键（含展示信息） */
export interface SpecialKeyCombo {
  /** 命令标识 */
  value: string;
  /** 菜单展示名 */
  label: string;
  /** 组合键提示文案 */
  hint: string;
  /** 依次按下的按键 */
  keys: SpecialKeyStep[];
}

/** X11 常用键 keysym */
export const KEYSYM = {
  Control_L: 0xffe3,
  Shift_L: 0xffe1,
  Alt_L: 0xffe9,
  Super_L: 0xffeb,
  Delete: 0xffff,
  Escape: 0xff1b,
  Tab: 0xff09,
  F4: 0xffc1,
  Print: 0xff61,
} as const;

/** 任务管理器：Ctrl+Alt+Del（Windows 安全注意序列） */
export const CTRL_ALT_DEL: SpecialKeyStep[] = [
  { keysym: KEYSYM.Control_L, code: 'ControlLeft' },
  { keysym: KEYSYM.Alt_L, code: 'AltLeft' },
  { keysym: KEYSYM.Delete, code: 'Delete' },
];

/**
 * 「其它无法触发的按键」候选项
 *
 * 覆盖 Windows 桌面常用、但会被本机 OS/浏览器截获的组合键。
 */
export const SPECIAL_KEY_COMBOS: SpecialKeyCombo[] = [
  {
    value: 'ctrl-alt-del',
    label: '任务管理器',
    hint: 'Ctrl+Alt+Del',
    keys: CTRL_ALT_DEL,
  },
  {
    value: 'ctrl-shift-esc',
    label: '任务管理器（直接）',
    hint: 'Ctrl+Shift+Esc',
    keys: [
      { keysym: KEYSYM.Control_L, code: 'ControlLeft' },
      { keysym: KEYSYM.Shift_L, code: 'ShiftLeft' },
      { keysym: KEYSYM.Escape, code: 'Escape' },
    ],
  },
  {
    value: 'alt-tab',
    label: '切换窗口',
    hint: 'Alt+Tab',
    keys: [
      { keysym: KEYSYM.Alt_L, code: 'AltLeft' },
      { keysym: KEYSYM.Tab, code: 'Tab' },
    ],
  },
  {
    value: 'alt-f4',
    label: '关闭窗口',
    hint: 'Alt+F4',
    keys: [
      { keysym: KEYSYM.Alt_L, code: 'AltLeft' },
      { keysym: KEYSYM.F4, code: 'F4' },
    ],
  },
  {
    value: 'win',
    label: '开始菜单',
    hint: 'Win',
    keys: [{ keysym: KEYSYM.Super_L, code: 'MetaLeft' }],
  },
  {
    value: 'ctrl-esc',
    label: '开始菜单（组合）',
    hint: 'Ctrl+Esc',
    keys: [
      { keysym: KEYSYM.Control_L, code: 'ControlLeft' },
      { keysym: KEYSYM.Escape, code: 'Escape' },
    ],
  },
  {
    value: 'print-screen',
    label: '截屏',
    hint: 'PrintScreen',
    keys: [{ keysym: KEYSYM.Print, code: 'PrintScreen' }],
  },
  {
    value: 'escape',
    label: 'Esc',
    hint: 'Esc',
    keys: [{ keysym: KEYSYM.Escape, code: 'Escape' }],
  },
];

/** 工具条「任务管理器」按钮直达的组合键 */
export const TASK_MANAGER_KEYS: SpecialKeyStep[] = CTRL_ALT_DEL;
