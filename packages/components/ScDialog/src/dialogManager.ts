/**
 * 对话框管理器
 * 用于管理多个对话框实例的状态和层级
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

import { reactive, ref } from 'vue';
import type { DialogState, MinimizePosition, EdgeDockPosition } from './types';

/**
 * 对话框实例信息
 */
interface DialogInstance {
    /** 对话框唯一标识 */
    id: string;
    /** 对话框状态 */
    state: DialogState;
    /** 层级索引 */
    zIndex: number;
    /** 是否激活 */
    isActive: boolean;
}

/**
 * 最小化对话框信息
 */
interface MinimizedDialog {
    /** 对话框ID */
    id: string;
    /** 对话框标题 */
    title: string;
    /** 对话框图标 */
    icon: string;
    /** 最小化位置 */
    position: MinimizePosition;
}

/**
 * 对话框管理器类
 */
class DialogManager {
    /** 基础 z-index */
    private baseZIndex = 2000;

    /** 当前最大 z-index */
    private currentZIndex = 2000;

    /** 对话框实例映射 */
    private dialogs = reactive<Map<string, DialogInstance>>(new Map());

    /** 最小化的对话框列表 */
    private minimizedDialogs = reactive<MinimizedDialog[]>([]);

    /** 当前激活的对话框ID */
    private activeDialogId = ref<string | null>(null);

    /**
     * 生成唯一ID
     * @returns 唯一ID字符串
     */
    generateId(): string {
        return `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * 注册对话框
     * @param id 对话框ID
     * @param initialState 初始状态
     * @returns 对话框实例
     */
    register(id: string, initialState?: Partial<DialogState>): DialogInstance {
        const state: DialogState = {
            isMinimized: false,
            isEdgeDocked: false,
            x: 0,
            y: 0,
            width: 500,
            height: 400,
            ...initialState
        };

        const instance: DialogInstance = {
            id,
            state,
            zIndex: this.getNextZIndex(),
            isActive: true
        };

        this.dialogs.set(id, instance);
        this.activeDialogId.value = id;

        return instance;
    }

    /**
     * 注销对话框
     * @param id 对话框ID
     */
    unregister(id: string): void {
        this.dialogs.delete(id);

        // 从最小化列表中移除
        const index = this.minimizedDialogs.findIndex(d => d.id === id);
        if (index > -1) {
            this.minimizedDialogs.splice(index, 1);
        }

        // 更新激活状态
        if (this.activeDialogId.value === id) {
            const remaining = Array.from(this.dialogs.keys());
            this.activeDialogId.value = remaining.length > 0 ? remaining[remaining.length - 1] : null;
        }
    }

    /**
     * 获取下一个 z-index
     * @returns z-index 值
     */
    getNextZIndex(): number {
        this.currentZIndex += 1;
        return this.currentZIndex;
    }

    /**
     * 激活对话框（置顶）
     * @param id 对话框ID
     */
    activate(id: string): void {
        const dialog = this.dialogs.get(id);
        if (dialog) {
            dialog.zIndex = this.getNextZIndex();
            dialog.isActive = true;
            this.activeDialogId.value = id;

            // 取消其他对话框的激活状态
            this.dialogs.forEach((d, key) => {
                if (key !== id) {
                    d.isActive = false;
                }
            });
        }
    }

    /**
     * 获取对话框实例
     * @param id 对话框ID
     * @returns 对话框实例
     */
    get(id: string): DialogInstance | undefined {
        return this.dialogs.get(id);
    }

    /**
     * 更新对话框状态
     * @param id 对话框ID
     * @param state 新状态
     */
    updateState(id: string, state: Partial<DialogState>): void {
        const dialog = this.dialogs.get(id);
        if (dialog) {
            Object.assign(dialog.state, state);
        }
    }

    /**
     * 最小化对话框
     * @param id 对话框ID
     * @param title 对话框标题
     * @param icon 对话框图标
     * @param position 最小化位置
     */
    minimize(id: string, title: string, icon: string, position: MinimizePosition): void {
        const dialog = this.dialogs.get(id);
        if (dialog) {
            dialog.state.isMinimized = true;
            dialog.state.minimizePosition = position;

            // 添加到最小化列表
            const existing = this.minimizedDialogs.find(d => d.id === id);
            if (!existing) {
                this.minimizedDialogs.push({ id, title, icon, position });
            }
        }
    }

    /**
     * 恢复对话框
     * @param id 对话框ID
     */
    restore(id: string): void {
        const dialog = this.dialogs.get(id);
        if (dialog) {
            dialog.state.isMinimized = false;
            dialog.state.minimizePosition = undefined;

            // 从最小化列表中移除
            const index = this.minimizedDialogs.findIndex(d => d.id === id);
            if (index > -1) {
                this.minimizedDialogs.splice(index, 1);
            }

            // 激活对话框
            this.activate(id);
        }
    }

    /**
     * 边缘吸附
     * @param id 对话框ID
     * @param edge 吸附边缘
     */
    dockToEdge(id: string, edge: EdgeDockPosition): void {
        const dialog = this.dialogs.get(id);
        if (dialog) {
            dialog.state.isEdgeDocked = true;
            dialog.state.dockedEdge = edge;
        }
    }

    /**
     * 取消边缘吸附
     * @param id 对话框ID
     */
    undockFromEdge(id: string): void {
        const dialog = this.dialogs.get(id);
        if (dialog) {
            dialog.state.isEdgeDocked = false;
            dialog.state.dockedEdge = undefined;
        }
    }

    /**
     * 获取最小化的对话框列表
     * @returns 最小化对话框列表
     */
    getMinimizedDialogs(): MinimizedDialog[] {
        return this.minimizedDialogs;
    }

    /**
     * 获取指定位置的最小化对话框
     * @param position 位置
     * @returns 该位置的最小化对话框列表
     */
    getMinimizedDialogsByPosition(position: MinimizePosition): MinimizedDialog[] {
        return this.minimizedDialogs.filter(d => d.position === position);
    }

    /**
     * 获取当前激活的对话框ID
     * @returns 激活的对话框ID
     */
    getActiveDialogId(): string | null {
        return this.activeDialogId.value;
    }

    /**
     * 获取所有对话框
     * @returns 对话框映射
     */
    getAll(): Map<string, DialogInstance> {
        return this.dialogs;
    }

    /**
     * 清空所有对话框
     */
    clear(): void {
        this.dialogs.clear();
        this.minimizedDialogs.splice(0, this.minimizedDialogs.length);
        this.activeDialogId.value = null;
        this.currentZIndex = this.baseZIndex;
    }
}

// 导出单例
export const dialogManager = new DialogManager();

export type { DialogInstance, MinimizedDialog };
