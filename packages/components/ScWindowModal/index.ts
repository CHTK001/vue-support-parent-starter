import type { App } from 'vue'
import ScWindowModal from './index.vue'
import type { WindowOptions, WindowInstance } from './types'
import { windowManagerStore } from './composables/useWindowManager'

/**
 * ScWindowModal 组件导出
 * @author CH
 * @version 1.0.0
 * @created 2024-01-15
 */

// 组件安装函数
ScWindowModal.install = (app: App): void => {
  app.component('ScWindowModal', ScWindowModal)
  
  // 全局属性注入
  app.config.globalProperties.$windowManager = windowManagerStore
}

// 导出组件
export default ScWindowModal

// 导出类型
export type { WindowOptions, WindowInstance }

// 导出窗口管理器
export { windowManagerStore }

// 导出composables
export { useWindowDrag } from './composables/useWindowDrag'
export { useWindowResize } from './composables/useWindowResize'
export { useWindowManager } from './composables/useWindowManager'

// 便捷方法导出
export const createWindow = windowManagerStore.createWindow
export const closeWindow = windowManagerStore.closeWindow
export const minimizeWindow = windowManagerStore.minimizeWindow
export const maximizeWindow = windowManagerStore.toggleMaximize
export const restoreWindow = windowManagerStore.restoreWindow
export const closeAllWindows = windowManagerStore.closeAllWindows
export const cascadeWindows = windowManagerStore.cascadeWindows
export const tileWindows = windowManagerStore.tileWindows