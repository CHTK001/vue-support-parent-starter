/**
 * ReEmpty 空状态组件备查：三个 layout（el / modern / plot）的 DOM 拓扑与计算样式。
 *
 * <p>用于人眼验收：mount 三个布局后，把图、容器、空态组件的 DOM 与计算样式打出来，
 * 对照下面的预期结构。ui 改动期间用它对齐视觉与布局，不取断言。
 *
 * 预期结构：
 *   el：  <el-empty :image :image-size :description>（el-empty 原样）
 *   modern：[异步 ModernLayout]
 *   plot：  <div class="re-empty__figure" data-hairline="plot" role="img" aria-label="...">
 *            <svg viewBox="0 0 400 320" aria-hidden="true">...</svg>
 *            （div 由 hairline 注入 display/block/aspect-ratio/position）
 *
 * 运行方式：pnpm --filter @pages/monitor vitest run re-empty-debug.spec.ts
 */
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import elementPlus from 'element-plus';
import { describe, it } from 'vitest';
import ReEmpty from '@repo/ui/re-empty';

const layouts: Array<[string, Record<string, unknown>, boolean]> = [
  ['el', {}, false],
  ['modern', {}, false],
  ['plot', { description: '暂无数据' }, false],
];

describe('ReEmpty 三 layout 结构', () => {
  for (const [layout, props] of layouts) {
    it(`layout=${layout} 成立`, async () => {
      const wrapper = mountReEmpty({ layout, ...props });
      await nextTick();
      await new Promise((r) => setTimeout(r, 20));
      const host = wrapper.find('.re-empty__figure').element as HTMLElement;
      // eslint-disable-next-line no-console
      console.log(`\n=== ReEmpty layout=${layout} root ===\n${wrapper.html().trim()}`);
      // eslint-disable-next-line no-console
      console.log(`\n=== ReEmpty layout=${layout} css ===\n${css()}`);
      if (layout === 'plot') {
        // eslint-disable-next-line no-console
        console.log(`\n=== ReEmpty layout=plot host ===\n${style(host)}`);
      }
      expect(wrapper.vm).toBeTruthy();
    });
  }
});

function mountReEmpty(props: Record<string, unknown> = {}) {
  return mount(ReEmpty, { props, global: { plugins: [elementPlus] } });
}

function css() {
  return Array.from(document.head.querySelectorAll('style')).map((s) => s.textContent).join('\n');
}

function style(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return Object.entries({
    display: cs.display,
    position: ct(cs.position),
    width: ct(cs.width),
    height: ct(cs.height),
    maxWidth: ct(cs.maxWidth),
    aspectRatio: ct(cs.aspectRatio),
    userSelect: ct(cs.userSelect),
    touchAction: ct(cs.touchAction),
  })
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

function ct(v: string) {
  return v === 'auto' || v === '' ? '-' : v;
}
