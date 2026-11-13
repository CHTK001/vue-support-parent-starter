/**
 * 进程列表多选：Shift 区间、批量出口与右键菜单的「常用项」不能被顺手删掉。
 *
 * <p>回归点：这三件事都只存在于一个组件里，没有独立函数可单测，
 * 一旦有人把行结构改回「只有 dblclick」或把 emit 收窄成单行版，
 * 编译与页面都不会报错，用户只是发现「选不了第二个」「右键没有复制」。
 * 所以按本包既有做法直接锁源码里的契约片段。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_PATH = join(process.cwd(), "src", "components", "profile", "ProfileProcesses.vue");
const source = readFileSync(SOURCE_PATH, "utf8");

describe("ProfileProcesses 多选与右键菜单", () => {
  it("批量动作有独立的 emit，父级只确认一次", () => {
    expect(source).toContain(`(e: "kill-many", rows: Record<string, any>[]): void;`);
    expect(source).toContain(`(e: "restart-many", rows: Record<string, any>[]): void;`);
    expect(source).toContain(`emit("kill-many", rows)`);
    expect(source).toContain(`emit("restart-many", rows)`);
  });

  it("Shift 以锚点扩区间，而不是逐行 toggle", () => {
    expect(source).toContain("function toggleSelect(pid: number, shift: boolean): void");
    expect(source).toContain("const a = keys.indexOf(anchorPid.value);");
    expect(source).toContain("for (let i = Math.min(a, b); i <= Math.max(a, b); i++) next.add(keys[i]);");
    // 锚点只在非 Shift 点击时移动，否则连续 Shift 会越选越偏
    expect(source).toContain("anchorPid.value = pid;");
  });

  it("表头全选带 indeterminate，行复选框自己吃掉点击不触发展开", () => {
    expect(source).toContain(":indeterminate.prop=\"someSelected\"");
    expect(source).toContain("@change=\"selectAll(($event.target as HTMLInputElement).checked)\"");
    expect(source).toContain('@click.stop.prevent="toggleSelect(p.pid, $event.shiftKey)"');
  });

  it("翻页 / 刷新后选择归零，避免批量动作打到上一页的 pid", () => {
    expect(source).toContain("watch(() => props.rows, clearSelection);");
  });

  it("右键菜单含分隔线与复制项，且多选时文案带数量", () => {
    expect(source).toContain("pf-ctx-sep");
    expect(source).toContain(`label: "复制进程名"`);
    expect(source).toContain(`label: "复制 PID"`);
    expect(source).toContain(`label: "复制命令行"`);
    expect(source).toContain("`结束所选 ${n} 个进程`");
  });

  it("右键点未选中的行先把选择收成这一行", () => {
    expect(source).toContain("if (!selected.value.has(p.pid)) {");
  });
});
