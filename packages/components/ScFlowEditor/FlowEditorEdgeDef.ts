/**
 * LogicFlow 自定义边定义
 * 支持直线(line)和折线(polyline)两种模式，默认直线
 */
import { LineEdge, LineEdgeModel, PolylineEdge, PolylineEdgeModel } from "@logicflow/core";
import type { LogicFlow } from "@logicflow/core";

// ── 边类型工厂 ──
export function createFlowEdgeDef(useLine: boolean) {
  const EdgeClass = useLine ? LineEdge : PolylineEdge;
  const EdgeModelClass = useLine ? LineEdgeModel : PolylineEdgeModel;

  class FlowEdgeModel extends EdgeModelClass {
    setAttributes() {
      const rs = this.properties.runtimeStatus;
      this.animation = rs === "RUNNING" || rs === "WAIT_MANUAL";
      this.offset = 20;
      // 默认圆角半径（折线模式下有效）
      this.radius = 8;
    }

    getEdgeStyle() {
      const style = super.getEdgeStyle();
      const rs = this.properties.runtimeStatus;
      const visited = this.properties.visited;

      if (rs === "RUNNING") {
        style.stroke = "#3b82f6";
        style.strokeWidth = 3;
      } else if (rs === "SUCCESS") {
        style.stroke = "#22c55e";
        style.strokeWidth = 2.5;
      } else if (rs === "FAILED") {
        style.stroke = "#ef4444";
        style.strokeWidth = 2.5;
      } else if (rs === "WAIT_MANUAL") {
        style.stroke = "#eab308";
        style.strokeWidth = 3;
      } else if (visited) {
        style.stroke = "#22c55e";
        style.strokeWidth = 2.5;
      } else {
        style.stroke = "#94a3b8";
        style.strokeWidth = 2;
      }

      style.strokeDasharray = "";
      style.hoverStroke = "#60a5fa";
      style.selectedStroke = "#3b82f6";
      return style;
    }

    getTextStyle() {
      const style = super.getTextStyle();
      style.fontSize = 11;
      style.fontWeight = 700;
      style.fill = "#fbbf24";
      style.background = {
        fill: "rgba(7, 11, 20, 0.92)",
        stroke: "#1e2a45",
        rx: 4,
        ry: 4,
        wrapPadding: [2, 8],
      };
      return style;
    }

    getEdgeAnimationStyle() {
      const style = super.getEdgeAnimationStyle();
      style.strokeDasharray = "8 5";
      style.animationDuration = "0.6s";
      style.animationName = "lf-edge-dash";
      return style;
    }
  }

  class FlowEdgeView extends EdgeClass {}

  return {
    type: "flow-edge",
    view: FlowEdgeView,
    model: FlowEdgeModel,
  };
}

// ── 注册边 ──
export function registerEdge(lf: LogicFlow, useLine = true) {
  const edgeDef = createFlowEdgeDef(useLine);
  lf.register(edgeDef);
}
