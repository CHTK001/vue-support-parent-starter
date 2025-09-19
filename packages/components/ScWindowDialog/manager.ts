/**
 * ScWindowDialog 全局管理器
 * @author CH
 * @version 1.0.0
 * @description 管理多个对话框的ID、激活状态、z-index等
 */

import { reactive, ref } from 'vue'

/**
 * 对话框实例信息
 */
export interface DialogInstance {
  /** 对话框ID */
  id: string
  /** 是否可见 */
  visible: boolean
  /** z-index值 */
  zIndex: number
  /** 是否激活（最顶层） */
  active: boolean
  /** 是否收缩状态 */
  shrunk: boolean
  /** 原始位置和尺寸 */
  originalRect?: {
    width: string | number
    height: string | number
    top: string
    left: string
  }
  /** 收缩位置 */
  shrunkPosition?: {
    top: string
    left: string
  }
  /** DOM元素引用 */
  element?: HTMLElement
}

/**
 * 全局对话框管理器
 */
class ScWindowDialogManager {
  /** 对话框实例映射 */
  private instances = reactive<Map<string, DialogInstance>>(new Map())
  
  /** 基础z-index值 */
  private baseZIndex = ref(2000)
  
  /** 当前最大z-index */
  private maxZIndex = ref(2000)
  
  /** ID计数器 */
  private idCounter = ref(0)

  /**
   * 生成唯一ID
   */
  generateId(): string {
    this.idCounter.value++
    return `sc-window-dialog-${this.idCounter.value}-${Date.now()}`
  }

  /**
   * 注册对话框实例
   * @param id 对话框ID
   * @param visible 是否可见
   */
  register(id: string, visible: boolean = false): DialogInstance {
    if (!this.instances.has(id)) {
      const instance: DialogInstance = {
        id,
        visible,
        zIndex: this.getNextZIndex(),
        active: false,
        shrunk: false
      }
      this.instances.set(id, instance)
      return instance
    }
    return this.instances.get(id)!
  }

  /**
   * 注销对话框实例
   * @param id 对话框ID
   */
  unregister(id: string): void {
    this.instances.delete(id)
  }

  /**
   * 获取对话框实例
   * @param id 对话框ID
   */
  getInstance(id: string): DialogInstance | undefined {
    return this.instances.get(id)
  }

  /**
   * 获取所有实例
   */
  getAllInstances(): DialogInstance[] {
    return Array.from(this.instances.values())
  }

  /**
   * 激活对话框（置顶）
   * @param id 对话框ID
   */
  activate(id: string): void {
    const instance = this.instances.get(id)
    if (!instance) return

    // 取消其他对话框的激活状态
    this.instances.forEach(inst => {
      if (inst.id !== id) {
        inst.active = false
      }
    })

    // 激活当前对话框并设置最高z-index
    instance.active = true
    instance.zIndex = this.getNextZIndex()
    
    // 更新DOM元素的z-index
    if (instance.element) {
      instance.element.style.zIndex = instance.zIndex.toString()
    }
  }

  /**
   * 更新对话框可见状态
   * @param id 对话框ID
   * @param visible 是否可见
   */
  updateVisible(id: string, visible: boolean): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.visible = visible
      if (visible) {
        this.activate(id)
      }
    }
  }

  /**
   * 设置对话框收缩状态
   * @param id 对话框ID
   * @param shrunk 是否收缩
   * @param originalRect 原始位置尺寸
   * @param shrunkPosition 收缩位置
   */
  setShrunk(id: string, shrunk: boolean, originalRect?: DialogInstance['originalRect'], shrunkPosition?: DialogInstance['shrunkPosition']): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.shrunk = shrunk
      if (originalRect) {
        instance.originalRect = originalRect
      }
      if (shrunkPosition) {
        instance.shrunkPosition = shrunkPosition
      }
    }
  }

  /**
   * 设置DOM元素引用
   * @param id 对话框ID
   * @param element DOM元素
   */
  setElement(id: string, element: HTMLElement): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.element = element
    }
  }

  /**
   * 获取下一个z-index值
   */
  private getNextZIndex(): number {
    this.maxZIndex.value += 10
    return this.maxZIndex.value
  }

  /**
   * 重置z-index计数器
   */
  resetZIndex(): void {
    this.maxZIndex.value = this.baseZIndex.value
  }

  /**
   * 获取可见的对话框数量
   */
  getVisibleCount(): number {
    return Array.from(this.instances.values()).filter(inst => inst.visible).length
  }

  /**
   * 检查是否有激活的对话框
   */
  hasActiveDialog(): boolean {
    return Array.from(this.instances.values()).some(inst => inst.active && inst.visible)
  }
}

// 创建全局单例实例
export const dialogManager = new ScWindowDialogManager()

// 导出类型
export type { ScWindowDialogManager }