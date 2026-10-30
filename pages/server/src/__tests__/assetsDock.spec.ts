/**
 * Dock（右侧快捷操作面板）收起的门禁。
 *
 * <p>两项需求：**中间底部一行显示不允许换行**、**关闭右侧是全部关闭**——Dock
 * 收起时 Dock 内的折叠钮、Dock 外暴露的展开手柄必须全部销毁，不再占位或
 * 残留任何 Dock 控件（铃声只由齿轮菜单的「显示右侧快捷操作」提供）。
 *
 * <p>不依赖浏览器：只断言页面源结构——DOM 行不行，开关是什么。
 *
 * @author CH
 * @since 4.0.0
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** 页面源文件路径（相对包根） */
const ASSETS_VIEW_PATH = new URL("../views/AssetsView.vue", import.meta.url).pathname;

function readPageSource(): string {
  return readFileSync(ASSETS_VIEW_PATH, "utf8");
}

describe("Dock 收起时全部销毁", () => {
  const source = readPageSource();
  const template = source.slice(source.indexOf("<template"));
  const script = source.slice(0, source.indexOf("<template"));
  const styles = source.slice(source.indexOf("<style"));

  it("Dock 整体由 v-if=\"dockOpen\" 挂载，收起时 DOM 被完整销毁", () => {
    expect(template).toContain('<aside v-if="dockOpen" class="as-dock">');
  });

  it("Dock 的折叠钮（最小化）只在 Dock 展开时存在", () => {
    expect(template).toContain('class="dock-foot__fold"');
    expect(template).not.toContain('class="as-dock-open"');
    expect(styles).not.toContain(".as-dock-open");
    expect(script).not.toContain("as-dock-open");
    expect(template).not.toContain(".as-dock-open");
  });

  it("Dock 收起时齿轮浮窗（恢复）随开关一起清空", () => {
    const toggle = script.slice(script.indexOf("function toggleDock"));
    expect(toggle).toContain("dockConfigVisible.value = false;");
    // 浮窗开关与 Dock 展开/收起 联动
    expect(script).toContain("const dockConfigVisible = ref(false);");
    expect(template).toContain("<div v-if=\"dockConfigVisible\" class=\"as-work__popover\"");
  });
});

describe("metrics bar：一行显示，永不换行", () => {
  const source = readPageSource();
  const styles = source.slice(source.indexOf("<style scoped"));

  function section(prefix: string, suffix: string): string {
    const start = styles.indexOf(prefix);
    expect(start).toBeGreaterThan(-1);
    const end = start === 0 ? false : styles.indexOf(suffix, start);
    expect(end).toBeGreaterThan(start);
    return styles.slice(start, end);
  }

  it(".hmb 顶层是 flex 容器，flex-wrap: nowrap 兜底", () => {
    expect(section(".hmb {", ".hmb__summary {")).toContain("flex-wrap: nowrap");
    expect(section(".hmb {", ".hmb__summary {")).toContain("white-space: nowrap");
  });

  it(".hmb__name/.hmb__addr/.hmb__metric-label/.hmb__pill 强制单行不换行", () => {
    for (const sel of [".hmb__name", ".hmb__addr", ".hmb__metric-label", ".hmb__pill"]) {
      const block = section(sel, sel + " {");
      expect(block).toContain("white-space: nowrap");
    }
  });
});
