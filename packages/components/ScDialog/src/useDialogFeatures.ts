/**
 * 对话框增强功能组合式函数
 * 提供边缘吸附、最小化、拖拽等功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

import { ref, computed, onMounted, onUnmounted, nextTick, watch, Ref } from 'vue';
import type { EdgeDockPosition, MinimizePosition, DialogState } from './types';
import { dialogManager } from './dialogManager';

/**
 * 对话框功能配置
 */
interface DialogFeaturesOptions {
    /** 对话框ID */
    dialogId: string;
    /** 对话框标题 */
    title: string;
    /** 对话框图标 */
    icon: string;
    /** 是否启用边缘吸附 */
    enableEdgeDock: boolean;
    /** 边缘吸附阈值 */
    edgeDockThreshold: number;
    /** 是否启用最小化 */
    enableMinimize: boolean;
    /** 默认最小化位置 */
    defaultMinimizePosition: MinimizePosition;
    /** 对话框可见状态 */
    visible: Ref<boolean>;
    /** 对话框元素引用 */
    dialogRef: Ref<HTMLElement | null>;
}

/**
 * 对话框增强功能组合式函数
 * @param options 配置选项
 * @returns 对话框功能方法和状态
 */
export function useDialogFeatures(options: DialogFeaturesOptions) {
    const {
        dialogId,
        title,
        icon,
        enableEdgeDock,
        edgeDockThreshold,
        enableMinimize,
        defaultMinimizePosition,
        visible,
        dialogRef
    } = options;

    // 状态
    const isMinimized = ref(false);
    const isEdgeDocked = ref(false);
    const dockedEdge = ref<EdgeDockPosition | undefined>();
    const minimizePosition = ref<MinimizePosition>(defaultMinimizePosition);
    const position = ref({ x: 0, y: 0 });
    const size = ref({ width: 500, height: 400 });
    const savedState = ref<{ x: number; y: number; width: number; height: number } | null>(null);

    // 计算当前 z-index
    const zIndex = computed(() => {
        const instance = dialogManager.get(dialogId);
        return instance?.zIndex ?? 2000;
    });

    /**
     * 注册对话框
     */
    const registerDialog = (): void => {
        dialogManager.register(dialogId, {
            isMinimized: false,
            isEdgeDocked: false,
            x: position.value.x,
            y: position.value.y,
            width: size.value.width,
            height: size.value.height
        });
    };

    /**
     * 注销对话框
     */
    const unregisterDialog = (): void => {
        dialogManager.unregister(dialogId);
    };

    /**
     * 激活对话框
     */
    const activateDialog = (): void => {
        dialogManager.activate(dialogId);
    };

    /**
     * 最小化对话框
     * @param pos 最小化位置
     */
    const minimize = (pos?: MinimizePosition): void => {
        if (!enableMinimize) return;

        const targetPosition = pos ?? minimizePosition.value;

        // 保存当前状态
        savedState.value = {
            x: position.value.x,
            y: position.value.y,
            width: size.value.width,
            height: size.value.height
        };

        isMinimized.value = true;
        minimizePosition.value = targetPosition;

        dialogManager.minimize(dialogId, title, icon, targetPosition);
    };

    /**
     * 恢复对话框
     */
    const restore = (): void => {
        if (!isMinimized.value) return;

        isMinimized.value = false;

        // 恢复保存的状态
        if (savedState.value) {
            position.value = { x: savedState.value.x, y: savedState.value.y };
            size.value = { width: savedState.value.width, height: savedState.value.height };
            savedState.value = null;
        }

        dialogManager.restore(dialogId);
    };

    /**
     * 计算最近的边缘
     * @param x 当前X坐标
     * @param y 当前Y坐标
     * @returns 最近的边缘位置
     */
    const getNearestEdge = (x: number, y: number): EdgeDockPosition => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const distances = {
            left: x,
            right: windowWidth - x,
            top: y,
            bottom: windowHeight - y
        };

        const minDistance = Math.min(...Object.values(distances));

        if (distances.left === minDistance) return 'left';
        if (distances.right === minDistance) return 'right';
        if (distances.top === minDistance) return 'top';
        return 'bottom';
    };

    /**
     * 吸附到边缘
     * @param edge 边缘位置
     */
    const dockToEdge = (edge: EdgeDockPosition): void => {
        if (!enableEdgeDock) return;

        // 保存当前状态
        if (!savedState.value) {
            savedState.value = {
                x: position.value.x,
                y: position.value.y,
                width: size.value.width,
                height: size.value.height
            };
        }

        isEdgeDocked.value = true;
        dockedEdge.value = edge;

        // 根据边缘位置调整对话框
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        switch (edge) {
            case 'left':
                position.value = { x: 0, y: 0 };
                size.value = { width: windowWidth / 2, height: windowHeight };
                break;
            case 'right':
                position.value = { x: windowWidth / 2, y: 0 };
                size.value = { width: windowWidth / 2, height: windowHeight };
                break;
            case 'top':
                position.value = { x: 0, y: 0 };
                size.value = { width: windowWidth, height: windowHeight / 2 };
                break;
            case 'bottom':
                position.value = { x: 0, y: windowHeight / 2 };
                size.value = { width: windowWidth, height: windowHeight / 2 };
                break;
        }

        dialogManager.dockToEdge(dialogId, edge);
    };

    /**
     * 取消边缘吸附
     */
    const undockFromEdge = (): void => {
        if (!isEdgeDocked.value) return;

        isEdgeDocked.value = false;
        dockedEdge.value = undefined;

        // 恢复保存的状态
        if (savedState.value) {
            position.value = { x: savedState.value.x, y: savedState.value.y };
            size.value = { width: savedState.value.width, height: savedState.value.height };
            savedState.value = null;
        }

        dialogManager.undockFromEdge(dialogId);
    };

    /**
     * 检查是否应该吸附到边缘
     * @param x 当前X坐标
     * @param y 当前Y坐标
     * @returns 是否应该吸附
     */
    const shouldDockToEdge = (x: number, y: number): boolean => {
        if (!enableEdgeDock) return false;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        return (
            x <= edgeDockThreshold ||
            x >= windowWidth - edgeDockThreshold ||
            y <= edgeDockThreshold ||
            y >= windowHeight - edgeDockThreshold
        );
    };

    /**
     * 处理拖拽结束
     * @param x 结束X坐标
     * @param y 结束Y坐标
     */
    const handleDragEnd = (x: number, y: number): void => {
        if (shouldDockToEdge(x, y)) {
            const edge = getNearestEdge(x, y);
            dockToEdge(edge);
        }
    };

    /**
     * 获取对话框状态
     * @returns 对话框状态
     */
    const getState = (): DialogState => {
        return {
            isMinimized: isMinimized.value,
            isEdgeDocked: isEdgeDocked.value,
            dockedEdge: dockedEdge.value,
            minimizePosition: minimizePosition.value,
            x: position.value.x,
            y: position.value.y,
            width: size.value.width,
            height: size.value.height
        };
    };

    /**
     * 计算最小化位置样式
     * @returns CSS样式对象
     */
    const minimizedStyle = computed(() => {
        if (!isMinimized.value) return {};

        const pos = minimizePosition.value;
        const offset = 20;
        const iconSize = 48;

        // 获取同位置的其他最小化对话框
        const samePositionDialogs = dialogManager.getMinimizedDialogsByPosition(pos);
        const index = samePositionDialogs.findIndex(d => d.id === dialogId);
        const stackOffset = index * (iconSize + 10);

        const style: Record<string, string> = {
            position: 'fixed',
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            zIndex: String(zIndex.value)
        };

        switch (pos) {
            case 'top-left':
                style.top = `${offset}px`;
                style.left = `${offset + stackOffset}px`;
                break;
            case 'top-right':
                style.top = `${offset}px`;
                style.right = `${offset + stackOffset}px`;
                break;
            case 'bottom-left':
                style.bottom = `${offset}px`;
                style.left = `${offset + stackOffset}px`;
                break;
            case 'bottom-right':
                style.bottom = `${offset}px`;
                style.right = `${offset + stackOffset}px`;
                break;
        }

        return style;
    });

    // 监听可见状态
    watch(visible, (val) => {
        if (val) {
            registerDialog();
        } else {
            unregisterDialog();
        }
    });

    // 生命周期
    onMounted(() => {
        if (visible.value) {
            registerDialog();
        }
    });

    onUnmounted(() => {
        unregisterDialog();
    });

    return {
        // 状态
        isMinimized,
        isEdgeDocked,
        dockedEdge,
        minimizePosition,
        position,
        size,
        zIndex,
        minimizedStyle,

        // 方法
        minimize,
        restore,
        dockToEdge,
        undockFromEdge,
        activateDialog,
        handleDragEnd,
        getState,
        getNearestEdge,
        shouldDockToEdge
    };
}
