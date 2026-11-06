/**
 * 空状态样式配置（other.emptyState）门禁：解析规则 + 多图形注册表 + ReEmpty 接线。
 *
 * <p>买断的内容：</p>
 * <ul>
 *   <li>优先级铁律：显式 prop &gt; 全局配置 &gt; 默认 "el"；enable=false 一律回落 "el"
 *       （等于接入配置前的行为，部署侧关掉不能有任何变化）；</li>
 *   <li>「动画图」不是单一款式：hairline 图形走注册表 {@code HAIRLINE_FIGURES}，
 *       配置里存键名，非法键名回落 "plot" 而不是白屏；</li>
 *   <li>ReEmpty 真的按 figure 挂载对应图形，换图形时先卸后挂，同一个宿主只有一份 svg。</li>
 * </ul>
 *
 * 运行方式：pnpm --filter @pages/monitor vitest run empty-state-config.spec.ts
 */
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import elementPlus from 'element-plus';
import { afterAll, describe, expect, it } from 'vitest';
import ReEmpty from '@repo/ui/re-empty';
import {
  EMPTY_LAYOUTS,
  normalizeEmptyLayout,
  resolveEmptyFigure,
  resolveEmptyLayout,
} from '@repo/ui/re-empty-resolve';
import {
  DEFAULT_HAIRLINE_FIGURE,
  HAIRLINE_FIGURES,
  HAIRLINE_FIGURE_KEYS,
  normalizeHairlineFigure,
} from '@repo/ui/re-empty-figures';

async function flush() {
  await nextTick();
  // 图落盘跟 rAF，多收 16ms 再判定
  await new Promise((resolve) => setTimeout(resolve, 16));
}

function mountReEmpty(props: {
  layout?: 'el' | 'modern' | 'plot';
  figure?: string;
  description?: string;
}) {
  return mount(ReEmpty, { props, global: { plugins: [elementPlus] } });
}

let wrappers: ReturnType<typeof mountReEmpty>[] = [];

describe('resolveEmptyLayout：显式 prop > 配置 > 默认', () => {
  it('显式 prop 永远压过配置（业务写死的 layout 不能被部署配置改掉）', () => {
    for (const layout of EMPTY_LAYOUTS) {
      expect(resolveEmptyLayout(layout, { enable: true, layout: 'plot' })).toBe(layout);
      // 配置关闭也压不过显式 prop
      expect(resolveEmptyLayout(layout, { enable: false, layout: 'plot' })).toBe(layout);
    }
  });

  it('没传 prop 时读配置；配置缺失 / 关闭一律回落 el', () => {
    expect(resolveEmptyLayout(undefined, undefined)).toBe('el');
    expect(resolveEmptyLayout(undefined, null)).toBe('el');
    expect(resolveEmptyLayout(undefined, {})).toBe('el'); // enable 缺省视为开启，但 layout 缺省
    expect(resolveEmptyLayout(undefined, { enable: false, layout: 'plot' })).toBe('el');
    expect(resolveEmptyLayout(undefined, { enable: false, layout: 'modern' })).toBe('el');
    expect(resolveEmptyLayout(undefined, { enable: true, layout: 'plot' })).toBe('plot');
    expect(resolveEmptyLayout(undefined, { enable: true, layout: 'modern' })).toBe('modern');
    expect(resolveEmptyLayout(undefined, { enable: true, layout: 'el' })).toBe('el');
  });

  it('非法 prop / 非法配置值都收窄成 el，不抛错、不白屏', () => {
    expect(resolveEmptyLayout('nope', { enable: true, layout: 'plot' })).toBe('plot');
    expect(resolveEmptyLayout(undefined, { enable: true, layout: 'nope' })).toBe('el');
    expect(resolveEmptyLayout(42, { enable: true, layout: 'modern' })).toBe('modern');
    expect(normalizeEmptyLayout('plot')).toBe('plot');
    expect(normalizeEmptyLayout(undefined)).toBe('el');
    expect(normalizeEmptyLayout('PLOT')).toBe('el');
  });
});

describe('resolveEmptyFigure：显式 prop > 配置 > 默认', () => {
  it('prop 优先，其次配置，都没给就交给注册表兜底', () => {
    expect(resolveEmptyFigure('terrain', { hairline: 'vault' })).toBe('terrain');
    expect(resolveEmptyFigure(undefined, { hairline: 'vault' })).toBe('vault');
    expect(resolveEmptyFigure('', { hairline: 'vault' })).toBe('vault');
    expect(resolveEmptyFigure(undefined, undefined)).toBeUndefined();
    expect(resolveEmptyFigure(undefined, {})).toBeUndefined();
    expect(resolveEmptyFigure(123, { hairline: 'sieve' })).toBe('sieve');
  });

  it('取值阶段不校验键名（键名兜底只有一处：normalizeHairlineFigure）', () => {
    expect(resolveEmptyFigure('not-a-figure', undefined)).toBe('not-a-figure');
    expect(normalizeHairlineFigure('not-a-figure')).toBe(DEFAULT_HAIRLINE_FIGURE);
  });
});

describe('hairline 图形注册表（动画图不能写死一款）', () => {
  it('至少 10 款可选，键名与挂载函数一一对应', () => {
    expect(HAIRLINE_FIGURE_KEYS.length).toBeGreaterThanOrEqual(10);
    for (const key of HAIRLINE_FIGURE_KEYS) {
      expect(typeof HAIRLINE_FIGURES[key], `${key} 应是挂载函数`).toBe('function');
    }
    expect(HAIRLINE_FIGURE_KEYS).toContain(DEFAULT_HAIRLINE_FIGURE);
    // 键名唯一，主题配置遍历时不会重复出按钮
    expect(new Set(HAIRLINE_FIGURE_KEYS).size).toBe(HAIRLINE_FIGURE_KEYS.length);
  });

  it('normalizeHairlineFigure 收窄任意值，非法值回落 plot', () => {
    for (const key of HAIRLINE_FIGURE_KEYS) expect(normalizeHairlineFigure(key)).toBe(key);
    expect(normalizeHairlineFigure(undefined)).toBe('plot');
    expect(normalizeHairlineFigure(null)).toBe('plot');
    expect(normalizeHairlineFigure('')).toBe('plot');
    expect(normalizeHairlineFigure(0)).toBe('plot');
    // 原型链上的键不能被当成图形（in 运算符会命中 toString 等）
    expect(normalizeHairlineFigure('toString')).toBe('plot');
    expect(normalizeHairlineFigure('__proto__')).toBe('plot');
  });
});

describe('ReEmpty 按 figure 挂图', () => {
  it('figure 决定 data-hairline，且真的挂在该宿主里', async () => {
    const wrapper = mountReEmpty({ layout: 'plot', figure: 'terrain' });
    wrappers.push(wrapper);
    await flush();
    const host = wrapper.find('.re-empty__figure').element as HTMLElement;
    expect(host.getAttribute('data-hairline')).toBe('terrain');
    expect(host.querySelector('svg')).toBeTruthy();
  });

  it('换 figure 先卸后挂，宿主里始终只有一份 svg', async () => {
    const wrapper = mountReEmpty({ layout: 'plot', figure: 'plot' });
    wrappers.push(wrapper);
    await flush();
    const host = wrapper.find('.re-empty__figure').element as HTMLElement;
    expect(host.getAttribute('data-hairline')).toBe('plot');

    await wrapper.setProps({ figure: 'vault' });
    await flush();
    expect(host.getAttribute('data-hairline')).toBe('vault');
    expect(host.querySelectorAll('svg').length, '旧图必须先销毁').toBe(1);

    await wrapper.setProps({ figure: 'sieve' });
    await flush();
    expect(host.getAttribute('data-hairline')).toBe('sieve');
    expect(host.querySelectorAll('svg').length).toBe(1);
  });

  it('非法 figure 回落 plot，不白屏', async () => {
    const wrapper = mountReEmpty({ layout: 'plot', figure: 'not-a-figure' });
    wrappers.push(wrapper);
    await flush();
    const host = wrapper.find('.re-empty__figure').element as HTMLElement;
    expect(host.getAttribute('data-hairline')).toBe('plot');
  });

  it('非 plot 布局不挂图，figure 传了也没用', async () => {
    const wrapper = mountReEmpty({ layout: 'el', figure: 'terrain' });
    wrappers.push(wrapper);
    await flush();
    const host = wrapper.find('.re-empty__figure').element as HTMLElement;
    expect(host.querySelector('svg')).toBeNull();
    expect(host.hasAttribute('data-hairline')).toBe(false);
  });
});

afterAll(() => {
  for (const wrapper of wrappers) wrapper.unmount();
  wrappers = [];
});
