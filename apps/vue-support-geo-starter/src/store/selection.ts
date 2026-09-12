/**
 * 选区状态
 *
 * 地图绘制 / 手动四至共享的选区：
 *   - bounds: WGS-84 四至
 *   - polygon: 多边形（可选）
 */
import { defineStore } from "pinia"
import type { GeoBounds } from "@/types"

/**
 * 选区状态接口
 * @author CH
 * @since 4.0.0
 */
interface SelectionState {
  bounds: GeoBounds | null
  polygon: Array<[number, number]> | null
  setBounds: (bounds: GeoBounds | null) => void
  setPolygon: (polygon: Array<[number, number]> | null) => void
  setSelection: (sel: { bounds: GeoBounds | null; polygon?: Array<[number, number]> | null }) => void
  clear: () => void
}

export const useSelectionStore = defineStore("geo-selection", {
  state: (): Omit<SelectionState, "setBounds" | "setPolygon" | "setSelection" | "clear"> => ({
    bounds: null,
    polygon: null,
  }),
  actions: {
    setBounds(bounds: GeoBounds | null) {
      this.bounds = bounds
    },
    setPolygon(polygon: Array<[number, number]> | null) {
      this.polygon = polygon
    },
    setSelection(sel: { bounds: GeoBounds | null; polygon?: Array<[number, number]> | null }) {
      this.bounds = sel.bounds
      this.polygon = sel.polygon ?? this.polygon
    },
    clear() {
      this.bounds = null
      this.polygon = null
    },
  },
})
