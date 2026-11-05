/**
 * ReEmpty 空状态组件验收（layout = "plot"）门禁。
 *
 * <p>买断的内容：以 hairline 的 {@code plot()} 图（没有数据的柱状图：底座上七片平板标签，
 * 前面一版网格线，pointer 把标签挑入半空）替换 ReTable 空态。图挂载在 ReEmpty 自己的
 * {@code .re-empty__figure} 容器里（ReEmpty 图布局唯一的图宿主），ReTable 侧不接触
 * hairline。</p>
 *
 * <p>图创建/销毁由 {@code figure(el, options) => ({ update, destroy })} 全权负责：
 * {@code create()} 里有 document 缺省炸弹（没 DOM 就投 Error），ReEmpty 的
 * {@code mountFigure} 把它挡在外面； {@code destroy()} 幂等（dead flag），一点痕迹不留。
 * 数字毛玻璃式地记得 host：同一个 .re-empty__figure 容器上第二次调用 create，
 * 前一份图先被卸下（WeakMap mounted 映射）。</p>
 *
 * 运行方式：pnpm --filter @pages/monitor vitest run re-empty-plot.spec.ts
 */
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import elementPlus from 'element-plus';
import { afterAll, describe, expect, it } from 'vitest';
import ReEmpty from '@repo/ui/re-empty';

const DEFAULT_LABEL = 'A bar chart with no data: seven flat tabs on its base, before a plate of grid lines. The pointer brushes them, and each lifts a little, the nearest most, and drops back to zero.';

function mountReEmpty(props: { layout?: 'el' | 'modern' | 'plot'; image?: string; imageSize?: number; description?: string } = {}) {
  return mount(ReEmpty, { props, global: { plugins: [elementPlus] } });
}

async function flush() {
  await nextTick();
  // hairline 的 style 注入是同步的，落图跟性在 rAF 之后；多收 16ms 再判定。
  await new Promise((resolve) => setTimeout(resolve, 16));
}

function hostOf(wrapper: ReturnType<typeof mountReEmpty>) {
  return wrapper.find('.re-empty__figure').element as HTMLElement;
}

let wrappers: ReturnType<typeof mountReEmpty>[] = [];

describe('ReEmpty = "plot" 图态渲染', () => {
  it('layout="plot" 时拥有 .re-empty__figure 容器，不出现 el-empty', async () => {
    const wrapper = mountReEmpty({ layout: 'plot', description: '暂无数据' });
    wrappers.push(wrapper);
    expect(wrapper.find('.re-empty__figure').exists(), '应绘出 .re-empty__figure 容器').toBe(true);
    expect(wrapper.find('el-empty').exists(), 'el-empty 不应出现').toBe(false);
    await flush();
  });

  it('figure 挂载在 .re-empty__figure 内，data-hairline 等于 plot', async () => {
    const wrapper = mountReEmpty({ layout: 'plot' });
    wrappers.push(wrapper);
    await flush();
    const hostEl = hostOf(wrapper);
    expect(hostEl.getAttribute('data-hairline'), 'host 应被 hairline 设置 data-hairline="plot"').toBe('plot');
    expect(hostEl.querySelector('svg'), 'host 下应有一份 figure 的 svg').toBeTruthy();
    expect(hostEl.getAttribute('data-hairline-theme'), 'auto 主题不落地主题属性').toBe(null);
    // 图说明走 aria-label
    expect(hostEl.getAttribute('aria-label'), 'auto 主题的 aria-label 应等于图说明').toBe(DEFAULT_LABEL);
  });

  it('描述文案驱动图标签，description 失效后回落到默认图说明', async () => {
    const wrapper = mountReEmpty({ layout: 'plot', description: '无数据' });
    wrappers.push(wrapper);
    await flush();
    const hostEl = hostOf(wrapper);
    expect(hostEl.getAttribute('aria-label')).toBe('无数据');
    await wrapper.setProps({ description: undefined });
    await nextTick();
    expect(hostEl.getAttribute('aria-label'), 'label 被清空后应回到图默认说明').toBe(DEFAULT_LABEL);
  });

  it('layout="el" 时是 el-empty，个中没图', async () => {
    const wrapper = mountReEmpty({ layout: 'el' });
    wrappers.push(wrapper);
    await flush();
    expect(wrapper.find('.el-empty').exists(), 'el 布局应出现 el-empty').toBe(true);
    expect(hostOf(wrapper).querySelector('svg'), 'el 布局不挂 figure 的图').toBeNull();
    expect(hostOf(wrapper).getAttribute('data-hairline'), 'el 布局 host 不带 data-hairline').toBe(null);
  });

  it('layout="modern" 时也不挂图', async () => {
    const wrapper = mountReEmpty({ layout: 'modern' });
    wrappers.push(wrapper);
    await flush();
    expect(hostOf(wrapper).querySelector('svg'), 'modern 布局不挂 figure 的图').toBeNull();
    expect(hostOf(wrapper).getAttribute('data-hairline')).toBe(null);
  });
});

describe('ReEmpty 图态生命周期', () => {
  it('mount 时注册，unmount 时清理干净（DOM、svg、aria / 属性），不留痕迹', async () => {
    const wrapper = mountReEmpty({ layout: 'plot' });
    wrappers.push(wrapper);
    await flush();
    const hostEl = hostOf(wrapper);
    expect(hostEl.querySelector('svg')).toBeTruthy();
    await wrapper.unmount();
    expect(hostEl.querySelector('svg'), 'unmount 后 svg 应被卸下').toBeNull();
    expect(hostEl.hasAttribute('data-hairline'), 'unmount 后 data-hairline 应被清除').toBe(false);
    expect(hostEl.hasAttribute('aria-label'), 'unmount 后 aria-label 应被恢复').toBe(false);
    expect(hostEl.hasAttribute('role'), 'unmount 后 role 应被恢复').toBe(false);
  });

  it('layout el → plot 动图，plot → el 卸图；两个方向都能重复挂载与卸下', async () => {
    const wrapper = mountReEmpty({ layout: 'el' });
    wrappers.push(wrapper);
    await flush();
    const hostEl = hostOf(wrapper);

    await wrapper.setProps({ layout: 'plot' });
    await flush();
    expect(hostEl.getAttribute('data-hairline'), 'layout 切换到 plot 后应挂载图').toBe('plot');
    expect(hostEl.querySelector('svg')).toBeTruthy();
    const drawn = hostEl.querySelector('svg')!.outerHTML.length;
    // 七片标签 + 底座 + 网格线，svg 内容很重
    expect(drawn).toBeGreaterThan(200);

    await wrapper.setProps({ layout: 'el' });
    await flush();
    expect(hostEl.getAttribute('data-hairline'), 'layout 切回 el 后图应卸下').toBe(null);
    expect(hostEl.querySelector('svg'), '图上的 svg 应被卸下').toBeNull();
    expect(hostEl.hasAttribute('aria-label')).toBe(false);

    // 再切回 plot：重新挂载（create 的 mounted 映射已对已 taken 的 host 置空）
    await wrapper.setProps({ layout: 'plot' });
    await flush();
    expect(hostEl.getAttribute('data-hairline'), 'layout 再切回 plot 应重新挂载图').toBe('plot');
    expect(hostEl.querySelector('svg')).toBeTruthy();
  });

  it('layout 在 plot 上先卸再挂，同一宿主只有一份图（create 是幂等的，前一份图被卸下）', async () => {
    const wrapper = mountReEmpty({ layout: 'plot' });
    wrappers.push(wrapper);
    await flush();
    const hostEl = hostOf(wrapper);
    expect(hostEl.querySelectorAll('svg').length).toBe(1);

    // 卸图再挂图：图宿主始终是同一个 div，创建不会多出一份 svg
    await wrapper.setProps({ layout: 'el' });
    await flush();
    expect(hostEl.querySelector('svg'), '图应被卸下').toBeNull();
    await wrapper.setProps({ layout: 'plot' });
    await flush();
    expect(hostEl.querySelector('svg')).toBeTruthy();
    expect(hostEl.querySelectorAll('svg').length).toBe(1);

    await wrapper.unmount();
    expect(hostEl.querySelector('svg'), 'unmount 后图应被卸下').toBeNull();
  });
});

describe('ReEmpty 图态 SSR 与安全', () => {
  it('在 document 未定义的幻境里，ReEmpty 不投图', async () => {
    const wrapper = mountReEmpty({ layout: 'plot' });
    wrappers.push(wrapper);
    await flush();
    const hostEl = hostOf(wrapper);
    // 先下好图，接住 mounted 映射
    expect(hostEl.querySelector('svg')).toBeTruthy();

    // 模拟 SSR：document 归零（图宿主存在，所以 mountFigure 走的是 guard 拦截）
    const original = globalThis.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).document = undefined;
    try {
      // layout 切到 el 卸下图，再切回 plot 时 mountFigure 被 document 守卫拦住
      await wrapper.setProps({ layout: 'el' });
      await flush();
      await wrapper.setProps({ layout: 'plot' });
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(hostEl.getAttribute('data-hairline'), 'document 缺失时 mountFigure 不会创建图').toBe(null);
      expect(hostEl.querySelector('svg'), '图不应被重新创建').toBeNull();
    } finally {
      globalThis.document = original;
    }
    // 拓扑恢复：layout 再切 el → plot，图重新起来（gate 只在 document 缺时拦一次）
    await wrapper.setProps({ layout: 'el' });
    await flush();
    await wrapper.setProps({ layout: 'plot' });
    await flush();
    expect(hostEl.getAttribute('data-hairline'), 'document 恢复后 layout=plot 应重新挂图').toBe('plot');
    expect(hostEl.querySelector('svg'), 'document 恢复后 layout=plot 的图应重新挂载').toBeTruthy();
  });

});

afterAll(() => {
  for (const wrapper of wrappers) wrapper.unmount();
});
