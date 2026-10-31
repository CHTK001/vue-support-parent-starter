/**
 * 监听端口视图切换：两个按钮必须「只有一个亮着」。
 *
 * <p>回归点：ReButton 把 class 转发到内层 {@code <button>}，父组件的 scoped 属性
 * 只落在它外层的 tooltip 包裹上。旧样式写的是普通后代选择器
 * （{@code .port-view-toggle .port-view-btn}），编译后会带上父组件的 data-v，
 * 而内层按钮没有这个属性 —— 规则整段失效，两个按钮都回落到 rs-btn 的白底，
 * 肉眼看起来「同时激活」。这里锁住 {@code :deep()} 写法与两态样式。</p>
 *
 * @author CH
 * @since 4.0.0.45
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_PATH = join(process.cwd(), "src", "components", "profile", "ProfilePorts.vue");

describe("ProfilePorts 视图切换样式", () => {
  const source = readFileSync(SOURCE_PATH, "utf8");
  const styles = source.slice(source.indexOf("<style"));

  it("用 :deep 命中 ReButton 内层按钮，而不是失效的普通后代选择器", () => {
    expect(styles).toContain(":deep(.rs-btn.port-view-btn)");
    expect(styles).toContain(":deep(.rs-btn.port-view-btn.on)");
    expect(styles).not.toContain(".port-view-toggle .port-view-btn {");
  });

  it("未选中透明无投影、选中白底带投影，两态视觉可分", () => {
    const baseStart = styles.indexOf(":deep(.rs-btn.port-view-btn)");
    const onStart = styles.indexOf(":deep(.rs-btn.port-view-btn.on)");
    expect(baseStart).toBeGreaterThan(-1);
    expect(onStart).toBeGreaterThan(baseStart);

    const base = styles.slice(baseStart, onStart);
    expect(base).toContain("background: transparent");
    expect(base).toContain("box-shadow: none");

    const on = styles.slice(onStart, styles.indexOf(":deep(.rs-btn.port-view-btn.on:hover"));
    expect(on).toContain("background: var(--el-bg-color, #fff)");
    expect(on).toContain("box-shadow: 0 1px 2px");
  });

  it("on 类只跟随 viewMode，默认仅列表视图处于激活态", () => {
    expect(source).toContain(`:class="{ on: viewMode === 'card' }"`);
    expect(source).toContain(`:class="{ on: viewMode === 'list' }"`);
    expect(source).toContain('const viewMode = ref<"card" | "list">("list");');
  });
});
