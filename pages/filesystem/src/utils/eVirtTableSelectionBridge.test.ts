import { describe, expect, it } from "vitest";
import { toSheetColumns } from "./eVirtTableSelectionBridge";

/**
 * 选区列坐标换算单测
 *
 * <p>回归对象：表格最左侧是 file-viewer 固定的**行号列**（e-virt 列 0），
 * sheet 的 A 列在表格里是第 1 列。早期实现把 e-virt 的表格列号直接当 sheet 列号，
 * 于是「选 B 列统计到 A 列的值」——用户反馈为「卡片数值对应到别的区域」。</p>
 */
describe("toSheetColumns（行号列偏移换算）", () => {
  it("表格列号扣掉行号列 = sheet 列号", () => {
    // sheet B = 表格第 2 列
    expect(toSheetColumns([2, 2])).toEqual([1, 1]);
    // sheet B..D = 表格第 2..4 列
    expect(toSheetColumns([2, 4])).toEqual([1, 3]);
    // sheet A = 表格第 1 列
    expect(toSheetColumns([1, 1])).toEqual([0, 0]);
  });

  it("落在行号列上时夹到 A 列，不产生 -1", () => {
    expect(toSheetColumns([0, 0])).toEqual([0, 0]);
    expect(toSheetColumns([0, 3])).toEqual([0, 2]);
  });

  it("反向拖选归一化为 [小, 大]", () => {
    expect(toSheetColumns([5, 2])).toEqual([1, 4]);
  });
});
