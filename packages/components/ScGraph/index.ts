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

const MIN_NODE_SIZE = 12;
const MAX_NODE_SIZE = 65;
const LAYOUT_NAMES: Record<string, string> = { "d3-force": "力导向", circular: "环形", concentric: "同心圆", grid: "网格", radial: "径向", dagre: "层级" };

const ScGraph = defineComponent({
  name: "ScGraph",
  props: {
    nodes: { type: Array as PropType<KgNode[]>, default: () => [] },
    edges: { type: Array as PropType<KgEdge[]>, default: () => [] },
    showToolbar: { type: Boolean, default: false },
    height: { type: [String, Number], default: "100%" },
    defaultLimit: { type: Number, default: 200 },
    toolbarExtras: { type: Array as PropType<(() => any)[]>, default: () => [] },
  },
  emits: ["node-click", "canvas-click", "node-select", "node-expand", "node-delete", "limit-change"],
  setup(props, { emit, expose }) {
    const containerRef = ref<HTMLElement | null>(null);
    const graphRef = shallowRef<Graph | null>(null);
    const containerId = `sc-graph-${Math.random().toString(36).slice(2, 9)}`;
    let selectedNodeId: string | null = null;

    // ── 视图状态 ──
    const grouped = ref(false);
    const edgeFlowEnabled = ref(false);
    const showNodeLabels = ref(true);
    const showEdgeLabels = ref(true);
    const labelPlacement = ref<"bottom" | "center">("bottom");
    const currentLayout = ref("d3-force");

    // ── 动画 ──
    let edgeAnimTimer: ReturnType<typeof setTimeout> | null = null;

    // ── UI 状态 ──
    const contextMenu = reactive({ show: false, x: 0, y: 0, nodeId: "" });
    const detailPanel = reactive({ show: false, x: 200, y: 80, nodeId: "", nodeData: null as any });
    const limit = ref(props.defaultLimit);
    const menuState = reactive({ node: false, edge: false, settings: false, layout: false });
    const detailDrag = reactive({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

    const primaryColor = cssVar("--el-color-primary", "#409eff");
    const borderColor = cssVar("--el-border-color-light", "rgba(255,255,255,0.1)");
    const textColor = cssVar("--el-text-color-primary", "#e0e0e0");
    const bgOverlay = cssVar("--el-bg-color-overlay", "#1e1e2e");
    const textSecondary = cssVar("--el-text-color-secondary", "#8888aa");
    const activeBg = cssVar("--el-color-primary", "#409eff") + "33";

    function getGroupColor(group: string): string {
      const palette: Record<string, string> = {
        Person: "#5b8ff9", Organization: "#5ad8a6", Location: "#f6bd16",
        Event: "#e8684a", Concept: "#9270ca", Product: "#1e9493",
        Technology: "#5f87d4", Framework: "#7b6fb0", Language: "#f08a5d",
        default: "#b0b8c4",
      };
      return palette[group] || palette.default;
    }

    function closeAllMenus() { menuState.node = false; menuState.edge = false; menuState.settings = false; menuState.layout = false; }

    function clearSelection() {
      if (!selectedNodeId || !graphRef.value) return;
      try { graphRef.value.setElementState(selectedNodeId, []); } catch { }
      selectedNodeId = null;
    }

    function hideContextMenu() { contextMenu.show = false; }

    function getLayoutConfig(ss: (w: number) => number, container: HTMLElement, n: any[]) {
      switch (currentLayout.value) {
        case "circular": return { type: "circular", radius: Math.min(container.clientWidth, container.clientHeight) * 0.35, divisions: 1, ordering: "degree" };
        case "concentric": return { type: "concentric", minNodeSpacing: 80, preventOverlap: true, nodeSize: (d: any) => ss(d.data?.weight || 1) + 20 };
        case "grid": return { type: "grid", rows: Math.ceil(Math.sqrt(n.length)), cols: Math.ceil(Math.sqrt(n.length)), preventOverlap: true, nodeSize: (d: any) => ss(d.data?.weight || 1) + 20 };
        case "radial": return { type: "radial", preventOverlap: true, unitRadius: 180, linkDistance: 200, nodeSize: (d: any) => ss(d.data?.weight || 1) + 20 };
        case "dagre": return { type: "dagre", rankdir: "LR", nodesep: 60, ranksep: 100, preventOverlap: true, nodeSize: (d: any) => [ss(d.data?.weight || 1) + 20, ss(d.data?.weight || 1) + 20] };
        default: return { type: "d3-force", preventOverlap: true, linkDistance: 150, nodeStrength: -300, linkStrength: 0.5, manyBodyStrength: -200, nodeSize: (d: any) => ss(d.data?.weight || 1) + 30 };
      }
    }

    // ── 边流动画 ──
    function startEdgeAnimation() {
      if (!graphRef.value) return;
      let frame = 0;
      const animate = () => {
        if (!edgeFlowEnabled.value || !graphRef.value) return;
        frame = (frame + 3) % 24;
        try {
          const data = graphRef.value.getData();
          if (data?.edges) {
            data.edges.forEach((e: any) => {
              if (e.style) e.style.lineDash = [frame, 24 - frame, frame, 24 - frame];
            });
            graphRef.value.setData(data);
            graphRef.value.render();
          }
        } catch { /* ignore */ }
        edgeAnimTimer = setTimeout(animate, 50);
      };
      edgeAnimTimer = setTimeout(animate, 50);
    }

    function stopEdgeAnimation() { if (edgeAnimTimer !== null) { clearTimeout(edgeAnimTimer); edgeAnimTimer = null; } }

    function toggleEdgeFlow() { edgeFlowEnabled.value = !edgeFlowEnabled.value; if (edgeFlowEnabled.value) startEdgeAnimation(); else stopEdgeAnimation(); }

    // ── 渲染图谱 ──
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
        animation: false,
        data: {
          nodes: nodes.map((n) => {
            const color = getGroupColor(n.group);
            const size = sizeScale(n.weight);
            const lp = labelPlacement.value;
            return {
              id: n.id,
              data: { label: n.label, group: n.group, weight: n.weight, img: n.img },
              style: {
                size,
                fill: color,
                labelText: showNodeLabels.value ? n.label : "",
                labelFontSize: 12,
                labelFill: textColor,
                labelPlacement: lp,
                labelOffsetY: lp === "center" ? 0 : 4,
                stroke: n.img ? "#5b8ff9" : borderColor,
                lineWidth: n.img ? 2 : 1.5,
                cursor: "pointer",
                ...(n.img ? { img: n.img, src: n.img, type: "image" as const } : {}),
              },
            };
          }),
          edges: edges.map((e) => ({
            id: `${e.from}->${e.to}`,
            source: e.from,
            target: e.to,
            data: { label: e.label, weight: e.weight },
            style: {
              stroke: borderColor,
              lineWidth: Math.max(1, Math.min(4, (e.weight || 1) * 2)),
              labelText: showEdgeLabels.value ? (e.label || "") : "",
              labelFontSize: 10,
              labelFill: textSecondary,
              labelBackground: true,
              labelBackgroundFill: cssVar("--el-bg-color", "#1e1e2e"),
              labelBackgroundOpacity: 0.8,
              endArrow: true,
              endArrowSize: 8,
              endArrowFill: borderColor,
              opacity: 0.7,
            },
          })),
        },
        node: { style: { labelPlacement: "bottom", labelOffsetY: 4 }, state: { selected: { stroke: "#fff", lineWidth: 3, labelFontWeight: "bold", labelFontSize: 14 }, highlighted: { fillOpacity: 1, strokeOpacity: 1 }, dimmed: { fillOpacity: 0.15, strokeOpacity: 0.15, labelFillOpacity: 0.15 } } },
        edge: { state: { highlighted: { stroke: "#7aa2f7", opacity: 1, lineWidth: 2 }, dimmed: { opacity: 0.05 } } },
        layout: getLayoutConfig(sizeScale, container, nodes),
        behaviors: ["drag-canvas", "zoom-canvas", { type: "drag-element", enable: (e: any) => e.targetType === "node" }, { type: "hover-activate", degree: 1, inactiveState: "dimmed" }],
        plugins: [{
          type: "tooltip", getContent: (_evt: any, items: any[]) => {
            if (!items?.length) return "";
            const d = items[0]?.data || {};
            return `<div style="padding:6px 10px;font-size:13px;line-height:1.6">
              <div style="font-weight:600;color:${textColor}">${d.label || ""}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${getGroupColor(d.group || "")}"></span>
                <span style="color:${textSecondary}">${d.group || ""}</span>
                ${d.weight != null ? `<span style="margin-left:8px;color:${textSecondary}">权重: ${d.weight}</span>` : ""}
              </div>
            </div>`;
          },
        }, ...(props.showToolbar ? [{ type: "minimap", size: [180, 120] } as const] : [])],
      };

      if (grouped.value) {
        const groupNames = [...new Set(nodes.map((n) => n.group).filter(Boolean))];
        (options.data as any).combos = groupNames.map((g) => ({ id: `combo-${g}`, data: { label: g }, style: { type: "rect", fill: getGroupColor(g) + "1A", stroke: getGroupColor(g), lineWidth: 2, padding: [30, 20, 20, 20], radius: 10, labelText: g, labelFontSize: 14, labelFill: getGroupColor(g), labelFontWeight: "bold", labelPlacement: "top" } }));
        (options.data.nodes as any[]).forEach((n: any) => { const og = nodes.find((nd) => nd.id === n.id); if (og?.group) n.combo = `combo-${og.group}`; });
        options.behaviors = ["drag-canvas", "zoom-canvas", { type: "drag-element", enable: (e: any) => e.targetType === "node" || e.targetType === "combo" }, { type: "hover-activate", degree: 1, inactiveState: "dimmed" }];
      }

      if (edgeFlowEnabled.value) {
        (options.data.edges as any[]).forEach((e: any) => { e.style = { ...e.style, lineDash: [8, 6] }; });
      }

      try {
        const graph = new Graph(options);
        graphRef.value = graph;
        graph.on("node:click", (evt: any) => {
          const nodeId = evt.target?.id || evt.elementId;
          if (!nodeId) return;
          clearSelection();
          graph.setElementState(nodeId, "selected"); selectedNodeId = nodeId;
          const nodeData = nodes.find((n) => n.id === nodeId);
          detailPanel.show = true; detailPanel.nodeId = nodeId; detailPanel.nodeData = nodeData || null;
          emit("node-click", nodeId); emit("node-select", nodeId);
        });
        graph.on("canvas:click", () => { clearSelection(); hideContextMenu(); closeAllMenus(); detailPanel.show = false; detailPanel.nodeData = null; emit("canvas-click"); emit("node-select", null); });
        graph.on("node:contextmenu", (evt: any) => { const nodeId = evt.target?.id || evt.elementId; if (!nodeId) return; contextMenu.show = true; contextMenu.x = evt.clientX; contextMenu.y = evt.clientY; contextMenu.nodeId = nodeId; });
        graph.on("canvas:contextmenu", () => { hideContextMenu(); });
        graph.render().catch((err: any) => { console.warn("[ScGraph] render error:", err); });
      } catch (err) { console.error("[ScGraph] init error:", err); }
    }

    // ── 生命周期 ──
    let resizeObserver: ResizeObserver | null = null;
    onMounted(() => {
      setTimeout(renderGraph, 50);
      if (containerRef.value) {
        resizeObserver = new ResizeObserver(() => { const g = graphRef.value; if (!g || !containerRef.value) return; const w = containerRef.value.clientWidth, h = containerRef.value.clientHeight; if (w > 0 && h > 0) { g.setSize(w, h); g.fitView(); } });
        resizeObserver.observe(containerRef.value);
      }
    });
    onBeforeUnmount(() => { resizeObserver?.disconnect(); resizeObserver = null; stopEdgeAnimation(); graphRef.value?.destroy(); graphRef.value = null; });
    watch(() => [props.nodes, props.edges], () => renderGraph(), { deep: true });

    function fitView() { graphRef.value?.fitView(); }
    function zoomTo(p: number | { mode: 'relative' | 'absolute'; value: number }) { const g = graphRef.value; if (!g) return; if (typeof p === 'number') g.zoomTo(p); else if (p.mode === 'relative') g.zoomTo(g.getZoom() * p.value); else g.zoomTo(p.value); }
    expose({ fitView, zoomTo });

    // ── 工具栏组件 ──
    const bS = (a = false, hover = false) => ({
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "32px", height: "32px", border: "none",
      background: a ? activeBg : "transparent",
      borderRadius: "6px", cursor: "pointer",
      color: a ? primaryColor : textColor,
      fontSize: "18px", lineHeight: "1",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      outline: "none",
    });
    const sep = () => h("div", { style: { height: "1px", margin: "3px 6px", background: `linear-gradient(90deg,transparent,${borderColor},transparent)`, opacity: 0.5 } });
    const menuPanel = (children: any[]) => h("div", { style: { position: "absolute", right: "40px", top: "0", display: "flex", flexDirection: "column", gap: "1px", padding: "4px", background: bgOverlay, border: `1px solid ${primaryColor}33`, borderRadius: "10px", whiteSpace: "nowrap", zIndex: "20", boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px ${primaryColor}22` } }, children);
    const mItem = (label: string, active = false, onClick?: () => void, color?: string) =>
      h("button", {
        style: {
          display: "flex", alignItems: "center", gap: "6px", border: "none",
          fontSize: "12px", padding: "6px 14px", width: "100%", height: "auto",
          background: active ? activeBg : "transparent",
          borderRadius: "6px", cursor: "pointer",
          color: active ? primaryColor : (color || textColor),
          transition: "all 0.15s",
          ...(active ? { fontWeight: "600" } : {}),
        },
        onClick,
        onMouseenter: (e: any) => { if (!active) e.target.style.background = `${primaryColor}15`; },
        onMouseleave: (e: any) => { if (!active) e.target.style.background = "transparent"; },
      }, [active ? h("span", { style: { width: "4px", height: "4px", borderRadius: "50%", background: primaryColor, flexShrink: 0 } }) : null, label]);

    function iconSvg(p: string) { return h("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }, ...p.split("|").map((d) => h("path", { d }))); }
    function tbBtn(content: any, active = false) { return h("button", { style: bS(active) }, content); }

    // ── 工具栏渲染 ──
    function renderToolbar() {
      if (!props.showToolbar || !props.nodes?.length) return null;
      const btns: any[] = [];

      // 聚合
      btns.push(h("button", { style: bS(grouped.value), title: grouped.value ? "取消聚合" : "聚合分组", onClick: () => { grouped.value = !grouped.value; renderGraph(); } }, iconSvg("M3 3h7v7H3z|M14 3h7v7h-7z|M3 14h7v7H3z|M14 14h7v7h-7z")));

      btns.push(sep());

      // 布局
      const layBtn = h("button", { style: { ...bS(false), fontSize: "11px", fontWeight: "bold" }, title: "布局: " + (LAYOUT_NAMES[currentLayout.value] || currentLayout.value), onClick: () => { closeAllMenus(); menuState.layout = !menuState.layout; } }, LAYOUT_NAMES[currentLayout.value]?.slice(0, 2) || "力");
      btns.push(h("div", { style: { position: "relative" } }, [layBtn, menuState.layout ? menuPanel(Object.entries(LAYOUT_NAMES).map(([k, n]) => mItem(n, currentLayout.value === k, () => { currentLayout.value = k; menuState.layout = false; renderGraph(); }))) : null]));

      btns.push(sep());

      // 节点工具
      const nodeBtn = h("button", { style: bS(false), title: "节点", onClick: () => { closeAllMenus(); menuState.node = !menuState.node; } }, iconSvg("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z|M12 6v6l4 2"));
      btns.push(h("div", { style: { position: "relative" } }, [nodeBtn, menuState.node ? menuPanel([mItem("显示文本", showNodeLabels.value, () => { showNodeLabels.value = !showNodeLabels.value; renderGraph(); }), mItem(labelPlacement.value === "center" ? "居中" : "底部", false, () => { labelPlacement.value = labelPlacement.value === "center" ? "bottom" : "center"; renderGraph(); })]) : null]));

      btns.push(sep());

      // 边工具
      const edgeBtn = h("button", { style: bS(false), title: "边", onClick: () => { closeAllMenus(); menuState.edge = !menuState.edge; } }, iconSvg("M22 12l-4-4m4 4l-4 4M2 12h16"));
      btns.push(h("div", { style: { position: "relative" } }, [edgeBtn, menuState.edge ? menuPanel([mItem("显示文本", showEdgeLabels.value, () => { showEdgeLabels.value = !showEdgeLabels.value; renderGraph(); }), mItem("开启流动", edgeFlowEnabled.value, () => toggleEdgeFlow())]) : null]));

      btns.push(sep());

      // 缩放
      btns.push(h("button", { style: bS(false), title: "放大", onClick: () => zoomTo({ mode: "relative", value: 1.3 }) }, iconSvg("M12 5v14M5 12h14")));
      btns.push(h("button", { style: bS(false), title: "缩小", onClick: () => zoomTo({ mode: "relative", value: 0.7 }) }, iconSvg("M5 12h14")));
      btns.push(h("button", { style: bS(false), title: "适应画布", onClick: () => fitView() }, iconSvg("M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3")));

      btns.push(sep());

      // 设置
      const setBtn = h("button", { style: { ...bS(false), fontSize: "14px", fontWeight: "bold" }, title: "设置", onClick: () => { closeAllMenus(); menuState.settings = !menuState.settings; } }, [h("span", null, String(limit.value))]);
      btns.push(h("div", { style: { position: "relative" } }, [setBtn, menuState.settings ? menuPanel([h("div", { style: { display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "12px", color: textColor } }, [h("span", null, "节点数"), h("button", { style: { ...bS(false), width: "22px", height: "22px", fontSize: "14px" }, onClick: () => { if (limit.value > 50) { limit.value -= 50; emit("limit-change", limit.value); } } }, iconSvg("M5 12h14")), h("span", { style: { minWidth: "24px", textAlign: "center", fontWeight: "bold", fontSize: "13px" } }, String(limit.value)), h("button", { style: { ...bS(false), width: "22px", height: "22px", fontSize: "14px" }, onClick: () => { limit.value += 50; emit("limit-change", limit.value); } }, iconSvg("M12 5v14M5 12h14"))])]) : null]));

      // 自定义扩展
      if (props.toolbarExtras?.length) {
        btns.push(sep());
        props.toolbarExtras.forEach((renderFn: any) => { const r = renderFn(); if (r != null) btns.push(r); });
      }

      return h("div", {
        class: "sc-graph-toolbar",
        style: { position: "absolute", top: "12px", right: "12px", display: "flex", flexDirection: "column", gap: "2px", padding: "6px 4px", background: bgOverlay, border: "1px solid " + borderColor, borderRadius: "10px", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", zIndex: "10" },
      }, btns);
    }

    // ── 右键菜单 ──
    function renderContextMenu() {
      if (!contextMenu.show) return null;
      return h("div", { style: { position: "fixed", left: contextMenu.x + "px", top: contextMenu.y + "px", zIndex: "1000", minWidth: "120px", background: bgOverlay, border: "1px solid " + borderColor, borderRadius: "10px", padding: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" } }, [
        h("div", { style: { padding: "8px 16px", cursor: "pointer", fontSize: "13px", borderRadius: "6px", color: textColor, transition: "background 0.15s" }, onClick: (e: MouseEvent) => { e.stopPropagation(); emit("node-expand", contextMenu.nodeId); hideContextMenu(); }, onMouseenter: (e: any) => { e.target.style.background = activeBg; }, onMouseleave: (e: any) => { e.target.style.background = "transparent"; } }, "扩线"),
        h("div", { style: { padding: "8px 16px", cursor: "pointer", fontSize: "13px", borderRadius: "6px", color: "#f56c6c", marginTop: "2px", transition: "background 0.15s" }, onClick: (e: MouseEvent) => { e.stopPropagation(); emit("node-delete", contextMenu.nodeId); hideContextMenu(); }, onMouseenter: (e: any) => { e.target.style.background = "rgba(245,108,108,0.15)"; }, onMouseleave: (e: any) => { e.target.style.background = "transparent"; } }, "删除"),
      ]);
    }

    // ── 详情弹窗 ──
    function renderDetailPanel() {
      if (!detailPanel.show || !detailPanel.nodeData) return null;
      const nd = detailPanel.nodeData as KgNode;
      const color = getGroupColor(nd.group);
      return h("div", { style: { position: "fixed", left: detailPanel.x + "px", top: detailPanel.y + "px", zIndex: "500", minWidth: "260px", maxWidth: "340px", background: bgOverlay, border: `1px solid ${borderColor}`, borderRadius: "14px", boxShadow: `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${primaryColor}15`, backdropFilter: "blur(16px)", fontSize: "13px", color: textColor, overflow: "hidden" } }, [
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "move", userSelect: "none", background: `linear-gradient(135deg,${color}22,${color}08)`, borderBottom: `1px solid ${borderColor}` }, onMousedown: (e: MouseEvent) => { detailDrag.dragging = true; detailDrag.startX = e.clientX; detailDrag.startY = e.clientY; detailDrag.origX = detailPanel.x; detailDrag.origY = detailPanel.y; const m = (ev: MouseEvent) => { if (!detailDrag.dragging) return; detailPanel.x = detailDrag.origX + (ev.clientX - detailDrag.startX); detailPanel.y = detailDrag.origY + (ev.clientY - detailDrag.startY); }; const u = () => { detailDrag.dragging = false; document.removeEventListener("mousemove", m); document.removeEventListener("mouseup", u); }; document.addEventListener("mousemove", m); document.addEventListener("mouseup", u); } }, [
          h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [
            h("span", { style: { width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: "0", boxShadow: `0 0 8px ${color}66` } }),
            h("span", { style: { fontWeight: "600", fontSize: "14px" } }, nd.label),
          ]),
          h("button", { style: { cursor: "pointer", fontSize: "18px", lineHeight: "1", opacity: 0.4, background: "none", border: "none", color: textColor, padding: "2px", transition: "opacity 0.15s" }, onClick: () => { detailPanel.show = false; }, onMouseenter: (e: any) => e.target.style.opacity = "0.8", onMouseleave: (e: any) => e.target.style.opacity = "0.4" }, "✕"),
        ]),
        h("div", { style: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" } }, [
          h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: `${color}0d`, borderRadius: "8px" } }, [
            h("span", { style: { fontSize: "16px" } }, "🏷"),
            h("span", { style: { color: textSecondary, fontSize: "12px" } }, "类型"),
            h("span", { style: { fontWeight: "500", marginLeft: "auto", color } }, nd.group),
          ]),
          nd.weight ? h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: `${primaryColor}08`, borderRadius: "8px" } }, [
            h("span", { style: { fontSize: "16px" } }, "⚖"),
            h("span", { style: { color: textSecondary, fontSize: "12px" } }, "权重"),
            h("span", { style: { fontWeight: "600", marginLeft: "auto" } }, String(nd.weight)),
          ]) : null,
          h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: `${textColor}08`, borderRadius: "8px" } }, [
            h("span", { style: { fontSize: "16px" } }, "🔗"),
            h("span", { style: { color: textSecondary, fontSize: "12px" } }, "ID"),
            h("span", { style: { fontSize: "12px", opacity: 0.7, marginLeft: "auto", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" } }, nd.id),
          ]),
          nd.img ? h("img", { style: { width: "100%", maxHeight: "120px", objectFit: "contain", borderRadius: "8px", marginTop: "2px", background: `${color}08` }, src: nd.img }) : null,
        ]),
      ]);
    }

    // ── 主渲染 ──
    return () => h("div", { style: { width: "100%", height: typeof props.height === "number" ? `${props.height}px` : props.height, position: "relative" } }, [
      h("div", { id: containerId, ref: containerRef, style: { width: "100%", height: "100%", background: "var(--el-bg-color)", borderRadius: "12px", overflow: "hidden" } },
        !props.nodes?.length ? h("div", { style: { position: "absolute", inset: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6b7280", gap: "12px" } }, [
          h("svg", { width: 48, height: 48, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 1.5 }, [h("path", { d: "M12 4.5v15m7.5-7.5h-15", "stroke-linecap": "round" })]),
          h("p", { style: { fontSize: "14px", margin: 0 } }, "暂无图谱数据"),
          h("span", { style: { fontSize: "12px", opacity: 0.6 } }, "请先上传文档或创建实体/关系"),
        ]) : null,
      ),
      renderToolbar(),
      renderContextMenu(),
      renderDetailPanel(),
    ]);
  },
});

export default ScGraph;
export { ScGraph };
