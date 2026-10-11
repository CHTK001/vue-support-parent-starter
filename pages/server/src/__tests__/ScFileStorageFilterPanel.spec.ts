/**
 * file-storage 配置面板（组件级）门禁。
 *
 * <p>这组用例钉的是本轮修过的那个缺陷的<b>渲染侧</b>：后端 schema 少声明一个
 * {@code layout}，面板并不会报错、也不会空白，而是<b>安静地把整个「目录列表页」
 * 分区少渲染一个字段</b>——编译与构建全绿，只有打开页面的人才看得出来。
 * 「加了参数却没出现」正是最难靠肉眼稳定发现的一类回归。</p>
 *
 * <p>面板改用语义分区卡片（ScFilterSectionCard）后，本文件新增两条门禁：
 * ① 分区标题渲染<b>纯标题文字</b>（计数徽标单独一层），否则徽标会把
 * 「访问控制」变成「访问控制 5」，任何按标题文本定位分区的断言都会失配；
 * ② 每一区都带字段数徽标，与「共 N 个参数」的总数对照即可发现漏渲染。</p>
 */
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';
import ScFileStorageFilterPanel from '../components/filters/ScFileStorageFilterPanel.vue';
import type { FilterParamSchema, FilterTypeMeta } from '../api';

/** 字段行桩的最小形状：本组用例只读取它的 field prop */
type RowStub = { props: (name: string) => FilterParamSchema };

/**
 * 字段行桩组件。
 *
 * 独立成常量以便按引用查找——用 findAllComponents({ name }) 去匹配自定义 stub
 * 在不同 VTU 版本上并不可靠（实测匹配不到，断言会静默退化成对空数组的比较）。
 * 桩里不渲染任何内容：字段行内部的 ReSwitch/ReSelect/ReInput 与本组用例无关。
 */
const FieldRowStub = defineComponent({
  name: 'ScFilterFieldRow',
  props: {
    field: { type: Object, required: true },
    value: { type: String, default: '' },
  },
  emits: ['update'],
  template: '<div class="fc-field-stub" />',
});

/**
 * 挂载面板，但把字段行换成桩。
 *
 * 语义分区卡片（ScFilterSectionCard）走<b>真实挂载</b>：分区标题、顺序、计数徽标
 * 都是真实 DOM，断言直接落在页面上可见的结构上。若改用 shallowMount，分区卡片
 * 会一并被桩掉、默认 slot 不渲染，用例就会退化成「断言一个空数组」——这类门禁
 * 最容易悄悄失效（实测已发生过：换掉分区容器组件后 9 条用例全红，却是因为找不到
 * 元素而非行为不对）。
 */
function mountPanel(props: {
  meta: FilterTypeMeta | null;
  filterType: string;
  modelValue: Record<string, string>;
}) {
  return mount(ScFileStorageFilterPanel, {
    props,
    global: { stubs: { ScFilterFieldRow: FieldRowStub } },
  });
}

/** 构造一个 schema 字段 */
function field(name: string, type = 'string'): FilterParamSchema {
  return { name, defaultValue: '', desc: '', type };
}

/** 构造 file-storage 的完整 meta（与后端 /filters 返回的形状一致） */
function metaOf(params: FilterParamSchema[]): FilterTypeMeta {
  return { type: 'file-storage', desc: '文件服务器', params };
}

/** 取全部分区卡片的纯标题文字（按渲染顺序） */
function sectionTitles(wrapper: ReturnType<typeof mountPanel>): string[] {
  return wrapper.findAll('.fsc-title-text').map((t) => t.text());
}

/** 取某个分区下所有字段行的 name（按渲染顺序） */
function fieldNamesIn(wrapper: ReturnType<typeof mountPanel>, sectionTitle: string): string[] {
  // 显式标注元素类型：挂载器的返回类型是泛型包装器，
  // 直接在回调里用参数会被推成隐式 any，vue-tsc 直接报错 TS7006。
  const sections = wrapper.findAll('.fsc');
  const target = sections.find((s: (typeof sections)[number]) => {
    const title = s.find('.fsc-title-text');
    return title.exists() && title.text() === sectionTitle;
  });
  if (!target) {
    return [];
  }
  // findAllComponents 的返回类型经由泛型包装器传播后元素退化为 any，
  // 在回调里直接用参数会触发 TS7006（隐式 any）。这里显式取出并标注，
  // 范围只限测试辅助函数内部。
  const rows = target.findAllComponents(FieldRowStub) as unknown as RowStub[];
  return rows.map((r) => r.props('field').name);
}

/** 取「其它参数」分区下的字段名 */
function restNames(wrapper: ReturnType<typeof mountPanel>): string[] {
  return fieldNamesIn(wrapper, '其它参数');
}

const FULL_SCHEMA: FilterParamSchema[] = [
  field('openPreview', 'boolean'),
  field('openDownload', 'boolean'),
  field('openRange', 'boolean'),
  field('openRemoteFile', 'boolean'),
  field('openWebjars', 'boolean'),
  field('layout', 'boolean'),
  field('layoutType', 'enum'),
  field('showFormat', 'boolean'),
  field('showSize', 'boolean'),
  field('showTime', 'boolean'),
  field('imageFilter', 'enum'),
  field('watermark'),
  field('openWatermark', 'boolean'),
];

describe('file-storage 配置面板分区渲染', () => {
  it('始终渲染三个分区，且顺序固定', () => {
    const wrapper = mountPanel({
      meta: metaOf(FULL_SCHEMA),
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(sectionTitles(wrapper)).toEqual(['访问控制', '目录列表页', '图片与水印']);
  });

  it('每个分区带字段数徽标，与实际渲染的字段数一致', () => {
    const wrapper = mountPanel({
      meta: metaOf(FULL_SCHEMA),
      filterType: 'file-storage',
      modelValue: {},
    });
    const sections = wrapper.findAll('.fsc');
    for (const section of sections) {
      const title = section.find('.fsc-title-text').text();
      const badge = section.find('.fsc-count');
      const rendered = section.findAllComponents(FieldRowStub).length;
      expect(badge.exists(), `${title} 分区应带字段数徽标`).toBe(true);
      expect(badge.text(), `${title} 分区的字段数徽标应等于实际渲染数`).toBe(String(rendered));
    }
  });

  it('目录列表页分区必须包含 layout —— 这正是后端漏声明时静默消失的那个字段', () => {
    const wrapper = mountPanel({
      meta: metaOf(FULL_SCHEMA),
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(fieldNamesIn(wrapper, '目录列表页')).toEqual([
      'layout',
      'layoutType',
      'showFormat',
      'showSize',
      'showTime',
    ]);
  });

  it('schema 未声明 layout 时该分区只渲染其余字段（证明渲染确实依赖 schema）', () => {
    const withoutLayout = FULL_SCHEMA.filter((f) => f.name !== 'layout');
    const wrapper = mountPanel({
      meta: metaOf(withoutLayout),
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(fieldNamesIn(wrapper, '目录列表页')).toEqual([
      'layoutType',
      'showFormat',
      'showSize',
      'showTime',
    ]);
  });

  it('访问控制与图片水印按各自 key 集合渲染', () => {
    const wrapper = mountPanel({
      meta: metaOf(FULL_SCHEMA),
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(fieldNamesIn(wrapper, '访问控制')).toEqual([
      'openPreview',
      'openDownload',
      'openRange',
      'openRemoteFile',
      'openWebjars',
    ]);
    expect(fieldNamesIn(wrapper, '图片与水印')).toEqual([
      'imageFilter',
      'watermark',
      'openWatermark',
    ]);
  });

  it('schema 里新增的未归类字段落到「其它参数」，不会丢配置', () => {
    const withNew = [...FULL_SCHEMA, field('brandNewParam')];
    const wrapper = mountPanel({
      meta: metaOf(withNew),
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(restNames(wrapper)).toEqual(['brandNewParam']);
  });

  it('schema 全部已归类时不渲染「其它参数」分区', () => {
    const wrapper = mountPanel({
      meta: metaOf(FULL_SCHEMA),
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(sectionTitles(wrapper)).not.toContain('其它参数');
  });

  it('meta 为 null 时不抛异常，三个分区仍然渲染（只是为空）', () => {
    const wrapper = mountPanel({
      meta: null,
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(sectionTitles(wrapper)).toEqual(['访问控制', '目录列表页', '图片与水印']);
    expect(fieldNamesIn(wrapper, '目录列表页')).toEqual([]);
  });

  it('schema 为 undefined（字段缺省）时同样不抛异常', () => {
    const meta: FilterTypeMeta = { type: 'file-storage', desc: '文件服务器' };
    const wrapper = mountPanel({
      meta,
      filterType: 'file-storage',
      modelValue: {},
    });
    expect(wrapper.findAll('.fsc')).toHaveLength(3);
  });
});

describe('file-storage 配置面板参数回写', () => {
  it('字段行回写时只改该字段，其余参数原样保留', async () => {
    const wrapper = mountPanel({
      meta: metaOf(FULL_SCHEMA),
      filterType: 'file-storage',
      modelValue: { watermark: 'demo', layout: 'true' },
    });
    const rows = wrapper.findAllComponents(FieldRowStub);
    const layoutRow = rows.find((r) => r.props('field').name === 'layout');
    expect(layoutRow, '应能找到 layout 字段行').toBeTruthy();

    await layoutRow!.vm.$emit('update', 'false');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted, '应触发 update:modelValue').toBeTruthy();
    const payload = emitted![emitted!.length - 1][0] as Record<string, string>;
    expect(payload.layout).toBe('false');
    expect(payload.watermark).toBe('demo');
  });

  it('modelValue 为空对象时回写不会抛异常', async () => {
    const wrapper = mountPanel({
      meta: metaOf(FULL_SCHEMA),
      filterType: 'file-storage',
      modelValue: {},
    });
    const rows = wrapper.findAllComponents(FieldRowStub);
    expect(rows.length, '应渲染出字段行').toBeGreaterThan(0);
    await rows[0].vm.$emit('update', 'X');
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
  });
});
