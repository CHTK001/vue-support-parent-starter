import type { CSSProperties } from 'vue'

/**
 * 主题类型
 * @author CH
 * @version 1.0.0
 */
export type ScWindowDialogTheme = 
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

/**
 * ScWindowDialog 组件 Props 接口
 * @author CH
 * @version 2.0.0
 * @description 继承 el-dialog 所有属性，并扩展主题和图标功能
 */
export interface ScWindowDialogProps {
  /** 对话框显示状态，支持 v-model */
  modelValue: boolean
  
  /** 对话框标题 */
  title?: string
  
  /** 对话框宽度，默认 50% */
  width?: number
  
  /** 对话框高度 */
  height?: number
  
  /** 是否为全屏对话框，默认 false */
  fullscreen?: boolean
  
  /** Dialog CSS 中的 margin-top 值，默认 15vh */
  top?: number
  
  /** 距离左侧的距离 */
  left?: number
  
  /** 是否需要遮罩层，默认 true */
  modal?: boolean
  
  /** body 部分的自定义 class 名 */
  bodyClass?: string
  
  /** footer 部分的自定义 class 名 */
  footerClass?: string
  
  /** Dialog 的自定义类名 */
  customClass?: string
  
  /** Dialog 的自定义样式 */
  style?: CSSProperties
  
  /** 是否可以通过点击 modal 关闭 Dialog，默认 true */
  closeOnClickModal?: boolean
  
  /** 是否可以通过按下 ESC 关闭 Dialog，默认 true */
  closeOnPressEscape?: boolean
  
  /** 是否显示关闭按钮，默认 true */
  showClose?: boolean
  
  /** 关闭前的回调，会暂停 Dialog 的关闭 */
  beforeClose?: (done: () => void) => void
  
  /** 为 Dialog 启用可拖拽功能，默认 false */
  draggable?: boolean
  
  /** 是否可调整大小 */
  resizable?: boolean
  
  /** 最小宽度 */
  minWidth?: number
  
  /** 最小高度 */
  minHeight?: number
  
  /** 最大宽度 */
  maxWidth?: number
  
  /** 最大高度 */
  maxHeight?: number
  
  /** 对话框层级 */
  zIndex?: number
  
  /** 自定义对话框动画，可以是动画名称或 Vue 过渡配置 */
  transition?: string | object
  
  // ========== ScWindowDialog 扩展属性 ==========
  
  /** 对话框主题，默认 default */
  theme?: ScWindowDialogTheme
  
  /** 标题图标，支持 Iconify 图标名称 */
  icon?: string
  
  /** 对话框唯一标识ID，用于全局管理多个弹框 */
  id?: string
  
  /** 是否启用自动收缩功能，默认 true */
  autoShrink?: boolean
  
  /** 收缩时的尺寸（像素），默认 64 */
  shrinkSize?: number
}

/**
 * ScWindowDialog 组件 Emits 接口
 * @author CH
 * @version 2.0.0
 * @description 继承 el-dialog 所有事件
 */
export interface ScWindowDialogEmits {
  /** 更新 modelValue */
  'update:modelValue': [value: boolean]
  
  /** Dialog 打开动画结束时的回调 */
  'opened': []
  
  /** Dialog 关闭动画结束时的回调 */
  'closed': []
  
  /** Dialog 打开的回调 */
  'open': []
  
  /** Dialog 关闭的回调 */
  'close': []
  
  /** 拖拽开始事件 */
  'dragStart': []
  
  /** 拖拽中事件 */
  'dragging': [position: { x: number; y: number }]
  
  /** 拖拽结束事件 */
  'dragStop': []
  
  /** 调整大小开始事件 */
  'resizeStart': []
  
  /** 调整大小中事件 */
  'resizing': [rect: { x: number; y: number; width: number; height: number }]
  
  /** 调整大小结束事件 */
  'resizeStop': []
}

/**
 * ScWindowDialog 组件实例类型
 * @author CH
 * @version 1.0.0
 */
export interface ScWindowDialogInstance {
  /** 打开对话框 */
  open: () => void
  
  /** 关闭对话框 */
  close: () => void
  
  /** 获取对话框显示状态 */
  getVisible: () => boolean
}

/**
 * 导出所有类型
 */
export type {
  ScWindowDialogTheme,
  ScWindowDialogProps,
  ScWindowDialogEmits,
  ScWindowDialogInstance
}