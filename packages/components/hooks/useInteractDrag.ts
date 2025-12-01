/**
 * InteractJS 拖拽和缩放组合式函数
 * 提供统一的拖拽、缩放功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

import { ref, onMounted, onUnmounted, Ref, watch } from "vue";
import interact from "interactjs";

/**
 * 拖拽配置选项
 */
export interface DragOptions {
    /** 是否启用拖拽 */
    enabled?: boolean;
    /** 是否启用惯性 */
    inertia?: boolean;
    /** 是否自动滚动 */
    autoScroll?: boolean;
    /** 拖拽手柄选择器 */
    handle?: string;
    /** 边界限制 */
    restrict?: {
        /** 限制元素选择器或元素 */
        restriction?: string | Element | "parent" | "self";
        /** 是否限制在边界内 */
        endOnly?: boolean;
        /** 边界偏移 */
        elementRect?: { top: number; left: number; bottom: number; right: number };
    };
    /** 网格吸附 */
    grid?: {
        x: number;
        y: number;
    };
    /** 边缘吸附阈值 */
    edgeSnapThreshold?: number;
    /** 拖拽开始回调 */
    onStart?: (event: any) => void;
    /** 拖拽移动回调 */
    onMove?: (event: any) => void;
    /** 拖拽结束回调 */
    onEnd?: (event: any) => void;
}

/**
 * 缩放配置选项
 */
export interface ResizeOptions {
    /** 是否启用缩放 */
    enabled?: boolean;
    /** 可缩放的边缘 */
    edges?: {
        left?: boolean;
        right?: boolean;
        bottom?: boolean;
        top?: boolean;
    };
    /** 最小尺寸 */
    minSize?: {
        width: number;
        height: number;
    };
    /** 最大尺寸 */
    maxSize?: {
        width: number;
        height: number;
    };
    /** 是否保持宽高比 */
    preserveAspectRatio?: boolean;
    /** 是否启用惯性 */
    inertia?: boolean;
    /** 缩放开始回调 */
    onStart?: (event: any) => void;
    /** 缩放移动回调 */
    onMove?: (event: any) => void;
    /** 缩放结束回调 */
    onEnd?: (event: any) => void;
}

/**
 * 拖拽状态
 */
export interface DragState {
    /** X 坐标 */
    x: number;
    /** Y 坐标 */
    y: number;
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
    /** 是否正在拖拽 */
    isDragging: boolean;
    /** 是否正在缩放 */
    isResizing: boolean;
}

/**
 * 使用 InteractJS 拖拽和缩放
 * @param elementRef 目标元素引用
 * @param dragOptions 拖拽配置
 * @param resizeOptions 缩放配置
 * @returns 拖拽状态和控制方法
 */
export function useInteractDrag(
    elementRef: Ref<HTMLElement | null>,
    dragOptions: DragOptions = {},
    resizeOptions: ResizeOptions = {}
) {
    // 状态
    const state = ref<DragState>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        isDragging: false,
        isResizing: false
    });

    // interact 实例
    let interactInstance: ReturnType<typeof interact> | null = null;

    /**
     * 初始化 interact
     */
    function initInteract() {
        if (!elementRef.value) return;

        // 获取初始尺寸
        const rect = elementRef.value.getBoundingClientRect();
        state.value.width = rect.width;
        state.value.height = rect.height;

        interactInstance = interact(elementRef.value);

        // 配置拖拽
        if (dragOptions.enabled !== false) {
            const dragConfig: any = {
                inertia: dragOptions.inertia ?? false,
                autoScroll: dragOptions.autoScroll ?? true,
                listeners: {
                    start(event: any) {
                        state.value.isDragging = true;
                        dragOptions.onStart?.(event);
                    },
                    move(event: any) {
                        state.value.x += event.dx;
                        state.value.y += event.dy;

                        // 应用位置
                        if (elementRef.value) {
                            elementRef.value.style.transform = `translate(${state.value.x}px, ${state.value.y}px)`;
                        }

                        dragOptions.onMove?.(event);
                    },
                    end(event: any) {
                        state.value.isDragging = false;

                        // 边缘吸附检测
                        if (dragOptions.edgeSnapThreshold) {
                            checkEdgeSnap(dragOptions.edgeSnapThreshold);
                        }

                        dragOptions.onEnd?.(event);
                    }
                }
            };

            // 拖拽手柄
            if (dragOptions.handle) {
                dragConfig.allowFrom = dragOptions.handle;
            }

            // 边界限制
            if (dragOptions.restrict) {
                dragConfig.modifiers = [
                    interact.modifiers.restrict({
                        restriction: dragOptions.restrict.restriction || "parent",
                        endOnly: dragOptions.restrict.endOnly ?? true,
                        elementRect: dragOptions.restrict.elementRect || { top: 0, left: 0, bottom: 1, right: 1 }
                    })
                ];
            }

            // 网格吸附
            if (dragOptions.grid) {
                dragConfig.modifiers = dragConfig.modifiers || [];
                dragConfig.modifiers.push(
                    interact.modifiers.snap({
                        targets: [interact.snappers.grid(dragOptions.grid)],
                        range: Infinity,
                        relativePoints: [{ x: 0, y: 0 }]
                    })
                );
            }

            interactInstance.draggable(dragConfig);
        }

        // 配置缩放
        if (resizeOptions.enabled) {
            const resizeConfig: any = {
                edges: resizeOptions.edges || { left: true, right: true, bottom: true, top: true },
                inertia: resizeOptions.inertia ?? false,
                listeners: {
                    start(event: any) {
                        state.value.isResizing = true;
                        resizeOptions.onStart?.(event);
                    },
                    move(event: any) {
                        const target = event.target;

                        // 更新尺寸
                        state.value.width = event.rect.width;
                        state.value.height = event.rect.height;

                        // 更新位置（处理从左边或上边缩放）
                        state.value.x += event.deltaRect.left;
                        state.value.y += event.deltaRect.top;

                        // 应用样式
                        if (elementRef.value) {
                            elementRef.value.style.width = `${state.value.width}px`;
                            elementRef.value.style.height = `${state.value.height}px`;
                            elementRef.value.style.transform = `translate(${state.value.x}px, ${state.value.y}px)`;
                        }

                        resizeOptions.onMove?.(event);
                    },
                    end(event: any) {
                        state.value.isResizing = false;
                        resizeOptions.onEnd?.(event);
                    }
                },
                modifiers: []
            };

            // 最小尺寸限制
            if (resizeOptions.minSize || resizeOptions.maxSize) {
                resizeConfig.modifiers.push(
                    interact.modifiers.restrictSize({
                        min: resizeOptions.minSize || { width: 100, height: 100 },
                        max: resizeOptions.maxSize || { width: Infinity, height: Infinity }
                    })
                );
            }

            // 保持宽高比
            if (resizeOptions.preserveAspectRatio) {
                resizeConfig.modifiers.push(
                    interact.modifiers.aspectRatio({
                        ratio: "preserve"
                    })
                );
            }

            interactInstance.resizable(resizeConfig);
        }
    }

    /**
     * 检查边缘吸附
     */
    function checkEdgeSnap(threshold: number) {
        if (!elementRef.value) return;

        const rect = elementRef.value.getBoundingClientRect();
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        let snapped = false;
        let edge = "";

        // 左边缘
        if (rect.left < threshold) {
            state.value.x = 0;
            snapped = true;
            edge = "left";
        }
        // 右边缘
        else if (rect.right > viewWidth - threshold) {
            state.value.x = viewWidth - rect.width;
            snapped = true;
            edge = "right";
        }

        // 上边缘
        if (rect.top < threshold) {
            state.value.y = 0;
            snapped = true;
            edge = edge ? `${edge}-top` : "top";
        }
        // 下边缘
        else if (rect.bottom > viewHeight - threshold) {
            state.value.y = viewHeight - rect.height;
            snapped = true;
            edge = edge ? `${edge}-bottom` : "bottom";
        }

        if (snapped && elementRef.value) {
            elementRef.value.style.transform = `translate(${state.value.x}px, ${state.value.y}px)`;
        }

        return { snapped, edge };
    }

    /**
     * 设置位置
     */
    function setPosition(x: number, y: number) {
        state.value.x = x;
        state.value.y = y;
        if (elementRef.value) {
            elementRef.value.style.transform = `translate(${x}px, ${y}px)`;
        }
    }

    /**
     * 设置尺寸
     */
    function setSize(width: number, height: number) {
        state.value.width = width;
        state.value.height = height;
        if (elementRef.value) {
            elementRef.value.style.width = `${width}px`;
            elementRef.value.style.height = `${height}px`;
        }
    }

    /**
     * 重置位置和尺寸
     */
    function reset() {
        state.value.x = 0;
        state.value.y = 0;
        if (elementRef.value) {
            elementRef.value.style.transform = "";
            elementRef.value.style.width = "";
            elementRef.value.style.height = "";
        }
    }

    /**
     * 启用拖拽
     */
    function enableDrag() {
        interactInstance?.draggable(true);
    }

    /**
     * 禁用拖拽
     */
    function disableDrag() {
        interactInstance?.draggable(false);
    }

    /**
     * 启用缩放
     */
    function enableResize() {
        interactInstance?.resizable(true);
    }

    /**
     * 禁用缩放
     */
    function disableResize() {
        interactInstance?.resizable(false);
    }

    /**
     * 销毁实例
     */
    function destroy() {
        if (interactInstance) {
            interactInstance.unset();
            interactInstance = null;
        }
    }

    // 监听元素变化
    watch(elementRef, (newEl, oldEl) => {
        if (oldEl) {
            destroy();
        }
        if (newEl) {
            initInteract();
        }
    });

    onMounted(() => {
        if (elementRef.value) {
            initInteract();
        }
    });

    onUnmounted(() => {
        destroy();
    });

    return {
        state,
        setPosition,
        setSize,
        reset,
        enableDrag,
        disableDrag,
        enableResize,
        disableResize,
        checkEdgeSnap,
        destroy
    };
}

export default useInteractDrag;
