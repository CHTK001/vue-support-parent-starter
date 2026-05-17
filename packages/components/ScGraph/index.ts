import { defineComponent, h, ref, reactive, onMounted, onBeforeUnmount, watch, shallowRef, type PropType } from "vue";
import { Graph, idOf, type GraphOptions } from "@antv/g6";

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

interface KgNode {
  id: string;
  label: string;
  group: string;
  weight?: number;
  img?: string;
}

interface KgEdge {
  from: string;
  to: string;
  label: string;
  weight: number;
}

const ScGraph = defineComponent({
  name: "ScGraph",
  props: {
    nodes: { type: Array as PropType<KgNode[]>, default: () => [] },
    edges: { type: Array as PropType<KgEdge[]>, default: () => [] },
    showToolbar: { type: Boolean, default: false },
    height: { type: [String, Number], default: "100%" },
    defaultLimit: { type: Number, default: 200 },
  },
  emits: ["node-click", "canvas-click", "node-select", "node-expand", "node-delete", "limit-change"],
  setup(props, { emit, expose }) {
    const containerRef = ref<HTMLElement | null>(null);
    const graphRef = shallowRef<Graph | null>(null);
    const containerId = `sc-graph-${Math.random().toString(36).slice(2, 9)}`;
    let selectedNodeId: string | null = null;
    const grouped = ref(false);
    const edgeFlowEnabled = ref(false);
    let edgeAnimTimer: ReturnType<typeof setTimeout> | null = null;
    let edgeAnimOffset = 0;
    const contextMenu = reactive({ show: false, x: 0, y: 0, nodeId: "" });
    const limit = ref(props.defaultLimit);
    const settingsOpen = ref(false);
    const activeBg = cssVar("--el-color-primary", "#409eff") + "33";
    const currentLayout = ref("d3-force");
    const layoutOpen = ref(false);

    const LAYOUTS: Record<string, any> = {
      "d3-force": { type: "d3-force", preventOverlap: true, linkDistance: 150, nodeStrength: -300, linkStrength: 0.5, manyBodyStrength: -200, nodeSize: (d: any) => sizeScale(d.data?.weight || 1) + 30 },
      circular: { type: "circular", radius: 280, divisions: 1, ordering: "degree", startAngle: 0, endAngle: 360 },
      concentric: { type: "concentric", minNodeSpacing: 80, preventOverlap: true, nodeSize: (d: any) => sizeScale(d.data?.weight || 1) + 20 },
      grid: { type: "grid", rows: 4, cols: 3, preventOverlap: true, nodeSize: (d: any) => sizeScale(d.data?.weight || 1) + 20 },
      radial: { type: "radial", preventOverlap: true, unitRadius: 180, linkDistance: 200, nodeSize: (d: any) => sizeScale(d.data?.weight || 1) + 20 },
    };
    const LAYOUT_NAMES: Record<string, string> = { "d3-force": "力导向", circular: "环形", concentric: "同心圆", grid: "网格", radial: "径向" };

    const MIN_NODE_SIZE = 12;
    const MAX_NODE_SIZE = 65;

    function getGroupColor(group: string): string {
      const palette: Record<string, string> = {
        Person: "#5b8ff9", Organization: "#5ad8a6", Location: "#f6bd16",
        Event: "#e8684a", Concept: "#9270ca", Product: "#1e9493",
        Technology: "#5f87d4", Framework: "#7b6fb0", Language: "#f08a5d",
        default: "#b0b8c4",
      };
      return palette[group] || palette.default;
    }

    function clearSelection() {
      if (!selectedNodeId || !graphRef.value) return;
      try { graphRef.value.setElementState(selectedNodeId, []); } catch { /* ignore */ }
      selectedNodeId = null;
    }

    function hideContextMenu() { contextMenu.show = false; }

    function startEdgeAnimation() {
      if (!graphRef.value) return;
      const animate = () => {
        if (!edgeFlowEnabled.value || !graphRef.value) return;
        edgeAnimOffset = (edgeAnimOffset - 3) % 20;
        try {
          const edges = props.edges;
          edges.forEach((e) => {
            const id = `${e.from}->${e.to}`;
            graphRef.value!.updateElement(id, { style: { lineDashOffset: edgeAnimOffset } });
          });
        } catch { /* ignore */ }
        edgeAnimTimer = setTimeout(animate, 40);
      };
      edgeAnimTimer = setTimeout(animate, 40);
    }

    function stopEdgeAnimation() {
      if (edgeAnimTimer !== null) { clearTimeout(edgeAnimTimer); edgeAnimTimer = null; }
      edgeAnimOffset = 0;
    }

    function toggleEdgeFlow() {
      edgeFlowEnabled.value = !edgeFlowEnabled.value;
      if (edgeFlowEnabled.value) {
        startEdgeAnimation();
      } else {
        stopEdgeAnimation();
      }
    }

    function renderGraph() {
      if (!containerRef.value) return;

      stopEdgeAnimation();
      graphRef.value?.destroy();
      graphRef.value = null;
      selectedNodeId = null;

      const { nodes, edges } = props;
      if (!nodes.length) return;

      const container = containerRef.value;
      container.innerHTML = "";

      const maxWeight = Math.max(1, ...nodes.map((n) => n.weight || 1));
      const sizeScale = (w: number) => MIN_NODE_SIZE + ((w || 1) / maxWeight) * (MAX_NODE_SIZE - MIN_NODE_SIZE);

      const options: GraphOptions = {
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        autoFit: "view",
        data: {
          nodes: nodes.map((n) => {
            const color = getGroupColor(n.group);
            const size = sizeScale(n.weight);
            return {
              id: n.id,
              data: { label: n.label, group: n.group, weight: n.weight, img: n.img },
              style: {
                size,
                fill: color,
                labelText: n.label,
                labelFontSize: 12,
                labelFill: cssVar("--el-text-color-primary", "#e0e0e0"),
                labelPlacement: "bottom",
                labelOffsetY: 4,
                stroke: n.img ? "#5b8ff9" : cssVar("--el-border-color", "#2a2a3e"),
                lineWidth: n.img ? 2 : 1.5,
                cursor: "pointer",
                ...(n.img
                  ? { img: n.img, src: n.img, type: "image" as const }
                  : {}),
              },
            };
          }),
          edges: edges.map((e) => ({
            id: `${e.from}->${e.to}`,
            source: e.from,
            target: e.to,
            data: { label: e.label, weight: e.weight },
            style: {
              stroke: cssVar("--el-border-color", "#4a4a6a"),
              lineWidth: Math.max(1, Math.min(4, (e.weight || 1) * 2)),
              labelText: e.label || "",
              labelFontSize: 10,
              labelFill: cssVar("--el-text-color-secondary", "#8888aa"),
              labelBackground: true,
              labelBackgroundFill: cssVar("--el-bg-color", "#1e1e2e"),
              labelBackgroundOpacity: 0.8,
              endArrow: true,
              endArrowSize: 8,
              endArrowFill: cssVar("--el-border-color", "#4a4a6a"),
              opacity: 0.7,
            },
          })),
        },
        node: {
          style: { labelPlacement: "bottom", labelOffsetY: 4 },
          state: {
            selected: { stroke: "#fff", lineWidth: 3, labelFontWeight: "bold" as const, labelFontSize: 14 },
            highlighted: { fillOpacity: 1, strokeOpacity: 1 },
            dimmed: { fillOpacity: 0.15, strokeOpacity: 0.15, labelFillOpacity: 0.15 },
          },
        },
        edge: {
          state: {
            highlighted: { stroke: "#7aa2f7", opacity: 1, lineWidth: 2 },
            dimmed: { opacity: 0.05 },
          },
        },
        layout: {
          ...LAYOUTS[currentLayout.value] || LAYOUTS["d3-force"],
          type: currentLayout.value,
        },
        behaviors: [
          "drag-canvas",
          "zoom-canvas",
          { type: "drag-element", enable: (e: any) => e.targetType === "node" },
          { type: "hover-activate", degree: 1, inactiveState: "dimmed" },
        ],
        plugins: [
          { type: "tooltip", getContent: (_evt: any, items: any[]) => items[0]?.data?.label || "" },
          ...(props.showToolbar ? [{ type: "minimap", size: [180, 120] } as const] : []),
        ],
      };

      // ── 聚合模式：按 group 创建 Combo ──
      if (grouped.value) {
        const groupNames = [...new Set(nodes.map((n) => n.group).filter(Boolean))];
        (options.data as any).combos = groupNames.map((g) => ({
          id: `combo-${g}`,
          data: { label: g },
          style: {
            type: "rect",
            fill: getGroupColor(g) + "1A",
            stroke: getGroupColor(g),
            lineWidth: 2,
            padding: [30, 20, 20, 20],
            radius: 10,
            labelText: g,
            labelFontSize: 14,
            labelFill: getGroupColor(g),
            labelFontWeight: "bold",
            labelPlacement: "top",
          },
        }));
        (options.data.nodes as any[]).forEach((n: any) => {
          const og = nodes.find((nd) => nd.id === n.id);
          if (og?.group) n.combo = `combo-${og.group}`;
        });
        options.layout = {
          type: "d3-force",
          preventOverlap: true,
          linkDistance: 80,
          nodeStrength: -50,
          linkStrength: 0.4,
          manyBodyStrength: -80,
          nodeSize: (d: any) => sizeScale(d.data?.weight || 1) + 20,
        };
        options.behaviors = [
          "drag-canvas",
          "zoom-canvas",
          { type: "drag-element", enable: (e: any) => e.targetType === "node" || e.targetType === "combo" },
          { type: "hover-activate", degree: 1, inactiveState: "dimmed" },
        ];
      }

      // ── 边流动画 ──
      if (edgeFlowEnabled.value) {
        (options.data.edges as any[]).forEach((e: any) => {
          e.style = { ...e.style, lineDash: [8, 6] };
        });
      }

      try {
        const graph = new Graph(options);
        graphRef.value = graph;

        graph.on("node:click", (evt: any) => {
          const nodeId = evt.target?.id || evt.elementId;
          if (!nodeId) return;

          // 清除前一个选中节点
          clearSelection();

          // 选中当前节点
          graph.setElementState(nodeId, "selected");
          selectedNodeId = nodeId;
          emit("node-click", nodeId);
          emit("node-select", nodeId);
        });

        graph.on("canvas:click", () => {
          clearSelection();
          hideContextMenu();
          settingsOpen.value = false;
          layoutOpen.value = false;
          emit("canvas-click");
          emit("node-select", null);
        });

        graph.on("node:contextmenu", (evt: any) => {
          evt.preventDefault?.();
          const nodeId = evt.target?.id || evt.elementId;
          if (!nodeId) return;
          contextMenu.show = true;
          contextMenu.x = evt.clientX;
          contextMenu.y = evt.clientY;
          contextMenu.nodeId = nodeId;
        });

        graph.on("canvas:contextmenu", (evt: any) => {
          evt.preventDefault?.();
          hideContextMenu();
        });

        graph.render().catch((err: any) => {
          console.warn("[ScGraph] render error:", err);
        });
      } catch (err) {
        console.error("[ScGraph] init error:", err);
      }
    }

    // ── 生命周期 ────────────────────────────────────────────
    let resizeObserver: ResizeObserver | null = null;
    const preventCtx = (e: MouseEvent) => { if (e.button === 2) e.preventDefault(); };

    onMounted(() => {
      setTimeout(renderGraph, 50);
      document.addEventListener("contextmenu", preventCtx);
      if (containerRef.value) {
        resizeObserver = new ResizeObserver(() => {
          const graph = graphRef.value;
          if (!graph || !containerRef.value) return;
          const w = containerRef.value.clientWidth;
          const h = containerRef.value.clientHeight;
          if (w > 0 && h > 0) {
            graph.setSize(w, h);
            graph.fitView();
          }
        });
        resizeObserver.observe(containerRef.value);
      }
    });

    onBeforeUnmount(() => {
      document.removeEventListener("contextmenu", preventCtx);
      resizeObserver?.disconnect();
      resizeObserver = null;
      stopEdgeAnimation();
      graphRef.value?.destroy();
      graphRef.value = null;
    });

    watch(
      () => [props.nodes, props.edges],
      () => renderGraph(),
      { deep: true }
    );

    // ── 暴露方法 ────────────────────────────────────────────
    function fitView() { graphRef.value?.fitView(); }
    function zoomTo(param: number | { mode: 'relative' | 'absolute'; value: number }) {
      const graph = graphRef.value;
      if (!graph) return;
      if (typeof param === 'number') {
        graph.zoomTo(param);
      } else if (param.mode === 'relative') {
        graph.zoomTo(graph.getZoom() * param.value);
      } else {
        graph.zoomTo(param.value);
      }
    }
    expose({ fitView, zoomTo });

    // ── 工具栏按钮 ──────────────────────────────────────────
    function renderToolbar() {
      if (!props.showToolbar || !props.nodes?.length) return null;

      const btnStyle: Record<string, string> = {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px", border: "none",
        background: "transparent", borderRadius: "6px", cursor: "pointer",
        color: cssVar("--el-text-color-primary", "#e0e0e0"),
        fontSize: "18px", lineHeight: "1",
      };

      function iconSvg(path: string) {
        return h("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" },
          ...path.split("|").map((d) => h("path", { d })),
        );
      }

      const borderColor = cssVar("--el-border-color-light", "rgba(255,255,255,0.1)");
      const textColor = cssVar("--el-text-color-primary", "#e0e0e0");

      const buttons: any[] = [];

      // 聚合/分组
      buttons.push(h("button", {
        style: { ...btnStyle, ...(grouped.value ? { background: activeBg, color: cssVar("--el-color-primary", "#409eff") } : {}) },
        title: grouped.value ? "取消聚合" : "聚合分组",
        onClick: () => { grouped.value = !grouped.value; renderGraph(); },
      }, iconSvg("M3 3h7v7H3z|M14 3h7v7h-7z|M3 14h7v7H3z|M14 14h7v7h-7z")));
      buttons.push(h("div", { style: { height: "1px", margin: "4px 6px", background: borderColor } }));

      // 布局切换
      buttons.push(h("div", { style: { position: "relative" } }, [
        h("button", {
          style: { ...btnStyle, fontSize: "11px", fontWeight: "bold" },
          title: "布局: " + (LAYOUT_NAMES[currentLayout.value] || currentLayout.value),
          onClick: () => { layoutOpen.value = !layoutOpen.value; settingsOpen.value = false; },
        }, LAYOUT_NAMES[currentLayout.value]?.slice(0, 2) || "力"),
        layoutOpen.value ? h("div", {
          style: {
            position: "absolute", right: "40px", top: "0",
            display: "flex", flexDirection: "column", gap: "2px",
            padding: "4px",
            background: cssVar("--el-bg-color-overlay", "#1e1e2e"),
            border: "1px solid " + borderColor,
            borderRadius: "6px",
            whiteSpace: "nowrap",
            zIndex: "20",
          },
        }, Object.entries(LAYOUT_NAMES).map(([key, name]) =>
          h("button", {
            style: {
              ...btnStyle, fontSize: "12px", padding: "4px 12px",
              width: "auto", height: "auto",
              ...(currentLayout.value === key ? { background: activeBg, color: cssVar("--el-color-primary", "#409eff") } : {}),
            },
            onClick: () => {
              currentLayout.value = key;
              layoutOpen.value = false;
              renderGraph();
            },
          }, name)
        )) : null,
      ]));

      // 边流动画
      buttons.push(h("button", {
        style: { ...btnStyle, ...(edgeFlowEnabled.value ? { background: activeBg, color: cssVar("--el-color-primary", "#409eff") } : {}) },
        title: edgeFlowEnabled.value ? "关闭流动" : "开启流动",
        onClick: () => toggleEdgeFlow(),
      }, iconSvg("M3 12h3l3-9 3 18 3-9 3 9 3-9 3 3")));
      buttons.push(h("div", { style: { height: "1px", margin: "4px 6px", background: borderColor } }));

      // 放大 / 缩小 / 适应画布
      buttons.push(h("button", { style: btnStyle, title: "放大", onClick: () => zoomTo({ mode: "relative", value: 1.3 }) }, iconSvg("M12 5v14M5 12h14")));
      buttons.push(h("button", { style: btnStyle, title: "缩小", onClick: () => zoomTo({ mode: "relative", value: 0.7 }) }, iconSvg("M5 12h14")));

      // 设置（默认查询数）
      buttons.push(h("div", { style: { height: "1px", margin: "4px 6px", background: borderColor } }));
      buttons.push(h("div", { style: { position: "relative" } }, [
        h("button", {
          style: { ...btnStyle, fontSize: "14px", fontWeight: "bold" },
          title: "设置默认查询数",
          onClick: () => { settingsOpen.value = !settingsOpen.value; },
        }, [
          h("span", null, String(limit.value)),
        ]),
        settingsOpen.value ? h("div", {
          style: {
            position: "absolute", right: "40px", top: "0",
            display: "flex", alignItems: "center", gap: "4px",
            padding: "4px 8px", whiteSpace: "nowrap",
            background: cssVar("--el-bg-color-overlay", "#1e1e2e"),
            border: "1px solid " + borderColor,
            borderRadius: "6px",
            fontSize: "12px",
            color: textColor,
          },
        }, [
          h("span", null, "节点数"),
          h("button", {
            style: { ...btnStyle, width: "24px", height: "24px", fontSize: "14px" },
            onClick: () => {
              if (limit.value > 50) { limit.value -= 50; emit("limit-change", limit.value); }
            },
          }, iconSvg("M5 12h14")),
          h("span", { style: { minWidth: "28px", textAlign: "center", fontWeight: "bold" } }, String(limit.value)),
          h("button", {
            style: { ...btnStyle, width: "24px", height: "24px", fontSize: "14px" },
            onClick: () => {
              limit.value += 50; emit("limit-change", limit.value);
            },
          }, iconSvg("M12 5v14M5 12h14")),
        ]) : null,
      ]));

      return h("div", {
        class: "sc-graph-toolbar",
        style: {
          position: "absolute", top: "12px", right: "12px",
          display: "flex", flexDirection: "column", gap: "2px",
          padding: "4px",
          background: cssVar("--el-bg-color-overlay", "rgba(30,30,35,0.85)"),
          border: "1px solid " + borderColor,
          borderRadius: "8px",
          backdropFilter: "blur(8px)",
          zIndex: "10",
        },
      }, buttons);
    }

    // ── 右键菜单 ───────────────────────────────────────────
    function renderContextMenu() {
      if (!contextMenu.show) return null;
      const menuItemStyle: Record<string, string> = {
        padding: "6px 16px", cursor: "pointer", fontSize: "13px",
        borderRadius: "4px", whiteSpace: "nowrap",
        color: cssVar("--el-text-color-primary", "#e0e0e0"),
      };
      return h("div", {
        style: {
          position: "fixed", left: contextMenu.x + "px", top: contextMenu.y + "px",
          zIndex: "1000", minWidth: "100px",
          background: cssVar("--el-bg-color-overlay", "#1e1e2e"),
          border: "1px solid " + cssVar("--el-border-color-light", "rgba(255,255,255,0.1)"),
          borderRadius: "8px", padding: "4px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        },
        onClick: () => hideContextMenu(),
      }, [
        h("div", { style: { ...menuItemStyle, background: "transparent" }, onClick: (e: MouseEvent) => { e.stopPropagation(); emit("node-expand", contextMenu.nodeId); hideContextMenu(); } }, "扩线"),
        h("div", { style: { ...menuItemStyle, background: "transparent", marginTop: "2px" }, onClick: (e: MouseEvent) => { e.stopPropagation(); emit("node-delete", contextMenu.nodeId); hideContextMenu(); } }, "删除"),
      ]);
    }

    // ── 渲染 ────────────────────────────────────────────────
    return () => {
      const wrapperStyle: Record<string, string> = {
        width: "100%",
        height: typeof props.height === "number" ? `${props.height}px` : props.height,
        position: "relative",
      };

      const containerStyle: Record<string, string> = {
        width: "100%",
        height: "100%",
        background: "var(--el-bg-color)",
        borderRadius: "12px",
        overflow: "hidden",
      };

      return h("div", { style: wrapperStyle }, [
        h("div", { id: containerId, ref: containerRef, style: containerStyle },
          !props.nodes?.length
            ? h("div", {
                style: {
                  position: "absolute", inset: "0",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  color: "#6b7280", gap: "12px",
                },
              }, [
                h("svg", { width: 48, height: 48, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 1.5 }, [
                  h("path", { d: "M12 4.5v15m7.5-7.5h-15", "stroke-linecap": "round" }),
                ]),
                h("p", { style: { fontSize: "14px", margin: 0 } }, "暂无图谱数据"),
                h("span", { style: { fontSize: "12px", opacity: 0.6 } }, "请先上传文档或创建实体/关系"),
              ])
            : null,
        ),
        renderToolbar(),
        renderContextMenu(),
      ]);
    };
  },
});

export default ScGraph;
export { ScGraph };
