/**
 * ReEmpty 在 ReTable 各插槽里的落地验收（layout = "plot"）。
 *
 * <p>门禁：空态图宿主 {.re-empty__figure} 必须出现在每个 ReTable 才能画空态的
 * 插槽里（element 表格 / vxe 表格 / view 视图 / card 卡片），且 ReTable 侧用
 * 同名 CSS 变量把宿主的宽/高/纵横比双向打通给 100%：
 *   - 100% 铺满、不 336px 封顶、5/4 比例关掉、height 向宿主继承；
 *   - 全局（ReEmpty 独立）口径不变：336px 宽 / 5/4 比例。
 * </p>
 *
 * <p>为什么只写 DOM 门禁：{@code @repo/ui/re-table} 经路径解析到 @repo/ui 的
 * {@code dist} 产物，scoped CSS 与外部的 element-plus / vxe-table 样式都
 * 未被 vitest 的 jsdom 环境加载——{@code getComputedStyle} 读到的是空值。
 * 真正的铺满尺寸在 real browser 验收（pages/monitor 配套的 mc-loc）里量。
 * </p>
 *
 * 运行方式：cd pages/monitor && node node_modules/vitest/vitest.mjs run src/__tests__/re-empty-host.spec.ts
 */
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import elementPlus from 'element-plus';
import { afterAll, describe, expect, it } from 'vitest';
import ReTable from '@repo/ui/re-table';
import ReEmpty from '@repo/ui/re-empty';

const COLS = [
  { prop: 'name', label: '名称', width: 120 },
  { prop: 'val', label: '数值', width: 80 },
];

/** ReTable 里"空"需要什么：空数据 + 固定高度（撑开空块给图宿主的尺寸）。 */
function mt(props: Record<string, unknown>) {
  return mount(ReTable, {
    props: { columns: COLS, data: [], height: 440, emptyText: '暂无数据', ...props },
    global: { plugins: [elementPlus] },
  });
}

/** ReEmpty 独立（不在 ReTable 里）：336px / 5/4 基线。 */
function mtReEmpty(props: Record<string, unknown> = {}) {
  return mount(ReEmpty, { props, global: { plugins: [elementPlus] } });
}

/** 空态图 slot 的图加载有门控（ReTable 的取数/加载），给它足够长的刷新窗口。 */
async function flushEmpty(wrapper: any) {
  for (let i = 0; i < 12; i++) {
    await nextTick();
    await new Promise((r) => setTimeout(r, 25));
  }
}

/** 图宿主：figure 节点 / data-hairline / 图 svg / aria-label 图说明。 */
function hostFor(wrapper: any) {
  const fig = wrapper.find('.re-empty__figure');
  if (!fig.exists()) return null;
  const hostEl = fig.element as HTMLElement;
  return {
    host: hostEl,
    text: hostEl.getAttribute('data-hairline'),
    svg: hostEl.querySelector('svg') as HTMLElement | null,
    label: hostEl.getAttribute('aria-label'),
  };
}

let wrappers = new Set<unknown>();

describe('ReTable 各插槽里的 ReEmpty 图宿主', () => {
  it('element 表格：空态图出现', async () => {
    const wrapper = mt({ engine: 'element', layout: 'table' });
    wrappers.add(wrapper);
    await flushEmpty(wrapper);
    const host = hostFor(wrapper);
    expect(host, 'element 表格应绘出空态图宿主').not.toBeNull();
    expect(host!.svg, '应挂上 plot 的 svg').toBeTruthy();
    expect(host!.text, 'plot 布局应有 data-hairline=plot').toBe('plot');
    expect(host!.label, 'ReTable 把 emptyText 作为图说明').toBe('暂无数据');
    wrapper.unmount();
  });

  it('vxe 表格：空态图出现', async () => {
    const wrapper = mt({ layout: 'table' });
    wrappers.add(wrapper);
    await flushEmpty(wrapper);
    const host = hostFor(wrapper);
    expect(host, 'vxe 表格应绘出空态图宿主').not.toBeNull();
    expect(host!.svg, '应挂上 plot 的 svg').toBeTruthy();
    expect(host!.text, 'plot 布局应有 data-hairline=plot').toBe('plot');
    expect(host!.label, 'ReTable 把 emptyText 作为图说明').toBe('暂无数据');
    wrapper.unmount();
  });

  it('view 视图：空态图出现', async () => {
    const wrapper = mt({ engine: 'element', layout: 'view' });
    wrappers.add(wrapper);
    await flushEmpty(wrapper);
    const host = hostFor(wrapper);
    expect(host, 'view 应绘出空态图宿主').not.toBeNull();
    expect(host!.svg, '应挂上 plot 的 svg').toBeTruthy();
    expect(host!.text, 'plot 布局应有 data-hairline=plot').toBe('plot');
    expect(host!.label, 'ReTable 把 emptyText 作为图说明').toBe('暂无数据');
    wrapper.unmount();
  });

  it('card 卡片：空态图出现', async () => {
    const wrapper = mt({ layout: 'card' });
    wrappers.add(wrapper);
    await flushEmpty(wrapper);
    const host = hostFor(wrapper);
    expect(host, 'card 应绘出空态图宿主').not.toBeNull();
    expect(host!.svg, '应挂上 plot 的 svg').toBeTruthy();
    expect(host!.text, 'plot 布局应有 data-hairline=plot').toBe('plot');
    expect(host!.label, 'ReTable 把 emptyText 作为图说明').toBe('暂无数据');
    wrapper.unmount();
  });

  it('用户 #empty 插槽：内容被 ReTable 包进空块，ReEmpty 不顶替', async () => {
    const wrapper = mount(ReTable, {
      props: { columns: COLS, data: [], height: 440, emptyText: '暂无数据', layout: 'table', engine: 'element' },
      global: { plugins: [elementPlus] },
      slots: { empty: `<div class="custom-empty">定制空态</div>` },
    });
    wrappers.add(wrapper);
    await flushEmpty(wrapper);
    expect(wrapper.find('.custom-empty').exists(), '用户插槽应原样进入空块').toBe(true);
    // 带了用户插槽时 ReEmpty 不挂（图中的 svg 不可见）
    expect(wrapper.findAll('.re-empty__figure').length).toBe(0);
    wrapper.unmount();
  });
});

describe('ReEmpty 独立口径（不被 ReTable 覆盖）', () => {
  it('336px / 5/4 比例，data-hairline=plot, 有图', async () => {
    const wrapper = mtReEmpty({ layout: 'plot' });
    wrappers.add(wrapper);
    await flushEmpty(wrapper);
    const host = hostFor(wrapper);
    expect(host, 'ReEmpty 独立应绘出宿主').not.toBeNull();
    expect(host!.svg, '应挂上 plot 的 svg').toBeTruthy();
    expect(host!.text, 'plot 布局应有 data-hairline=plot').toBe('plot');
    // 独立口径：336px 封顶 + 5/4 比例（上联 override 不在场，max-width 走定值）
    expect(getComputedStyle(host!.host).getPropertyValue('max-width')).toEqual('336px');
    expect(getComputedStyle(host!.host).getPropertyValue('aspect-ratio')).toEqual('5 / 4');
    expect(getComputedStyle(host!.host).getPropertyValue('--re-empty-figure-width')).toEqual('336px');
    expect(getComputedStyle(host!.host).getPropertyValue('--re-empty-aspect-ratio')).toEqual('5/4');
    wrapper.unmount();
  });
});

afterAll(() => {
  for (const wrapper of wrappers) {
    if (wrapper && typeof wrapper.unmount === 'function') wrapper.unmount();
  }
});
