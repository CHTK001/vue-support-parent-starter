/**
 * file-storage 配置面板（组件级）门禁。
 *
 * <p>这组用例钉的是本轮修过的那个缺陷的<b>渲染侧</b>：后端 schema 少声明一个
 * {@code layout}，面板并不会报错、也不会空白，而是<b>安静地把整个「目录列表页」
 * 分区少渲染一个字段</b>——编译与构建全绿，只有打开页面的人才看得出来。
 * 「加了参数却没出现」正是最难靠肉眼稳定发现的一类回归。</p>
 *
 * <p>用 shallowMount 而不是 mount：本用例要验证的是<b>面板如何把 schema 分派到各分区</b>，
 * 而不是字段行内部的 switch/select/input 渲染。把字段行桩掉后，断言只依赖面板自身的
 * props 计算与分区顺序，不会被字段行实现的变化带着一起变红。</p>
 */
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ScFileStorageFilterPanel from '../components/filters/ScFileStorageFilterPanel.vue';
import type { FilterParamSchema, FilterTypeMeta } from '../api';

/** 字段行桩：本用例只读取它的 field prop */
type RowStub = { props: (name: string) => FilterParamSchema };

/** 构造一个 schema 字段 */
function field(name: string, type = 'string'): FilterParamSchema {
  return { name, defaultValue: '', desc: '', type };
}

/** 构造 file-storage 的完整 meta（与后端 /filters 返回的形状一致） */
function metaOf(params: FilterParamSchema[]): FilterTypeMeta {
  return { type: 'file-storage', desc: '文件服务器', params };
}

/** 取某个分区下所有字段行的 name（按渲染顺序） */
function fieldNamesIn(wrapper: ReturnType<typeof shallowMount>, sectionTitle: string): string[] {
  const sections = wrapper.findAll('.fc-section');
  // 显式标注元素类型：shallowMount 的返回类型是泛型包装器，
  // 直接在回调里用参数会被推成隐式 any，vue-tsc 直接报错 TS7006。
  const target = sections.find(
    (s: (typeof sections)[number]) => s.find('.fc-section-title').text() === sectionTitle,
  );
  if (!target) {
    return [];
  }
  // findAllComponents 的返回类型经由泛型包装器传播后元素退化为 any，
  // 在回调里直接用参数会触发 TS7006（隐式 any）。这里显式取出并标注，
  // 范围只限测试辅助函数内部。
  const rows = target.findAllComponents({ name: 'ScFilterFieldRow' }) as unknown as RowStub[];
  return rows.map((r) => r.props('field').name);
}

/** 取「其它参数」分区下的字段名 */
function restNames(wrapper: ReturnType<typeof shallowMount>): string[] {
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
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: metaOf(FULL_SCHEMA), filterType: 'file-storage', modelValue: {} },
    });
    const titles = wrapper.findAll('.fc-section-title').map((t) => t.text());
    expect(titles).toEqual(['访问控制', '目录列表页', '图片与水印']);
  });

  it('目录列表页分区必须包含 layout —— 这正是后端漏声明时静默消失的那个字段', () => {
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: metaOf(FULL_SCHEMA), filterType: 'file-storage', modelValue: {} },
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
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: metaOf(withoutLayout), filterType: 'file-storage', modelValue: {} },
    });
    expect(fieldNamesIn(wrapper, '目录列表页')).toEqual([
      'layoutType',
      'showFormat',
      'showSize',
      'showTime',
    ]);
  });

  it('访问控制与图片水印按各自 key 集合渲染', () => {
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: metaOf(FULL_SCHEMA), filterType: 'file-storage', modelValue: {} },
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
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: metaOf(withNew), filterType: 'file-storage', modelValue: {} },
    });
    expect(restNames(wrapper)).toEqual(['brandNewParam']);
  });

  it('schema 全部已归类时不渲染「其它参数」分区', () => {
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: metaOf(FULL_SCHEMA), filterType: 'file-storage', modelValue: {} },
    });
    const titles = wrapper.findAll('.fc-section-title').map((t) => t.text());
    expect(titles).not.toContain('其它参数');
  });

  it('meta 为 null 时不抛异常，三个分区仍然渲染（只是为空）', () => {
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: null, filterType: 'file-storage', modelValue: {} },
    });
    const titles = wrapper.findAll('.fc-section-title').map((t) => t.text());
    expect(titles).toEqual(['访问控制', '目录列表页', '图片与水印']);
    expect(fieldNamesIn(wrapper, '目录列表页')).toEqual([]);
  });

  it('schema 为 undefined（字段缺省）时同样不抛异常', () => {
    const meta: FilterTypeMeta = { type: 'file-storage', desc: '文件服务器' };
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta, filterType: 'file-storage', modelValue: {} },
    });
    expect(wrapper.findAll('.fc-section')).toHaveLength(3);
  });
});

describe('file-storage 配置面板参数回写', () => {
  it('字段行回写时只改该字段，其余参数原样保留', async () => {
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: {
        meta: metaOf(FULL_SCHEMA),
        filterType: 'file-storage',
        modelValue: { watermark: 'demo', layout: 'true' },
      },
    });
    const rows = wrapper.findAllComponents({ name: 'ScFilterFieldRow' });
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
    const wrapper = shallowMount(ScFileStorageFilterPanel, {
      props: { meta: metaOf(FULL_SCHEMA), filterType: 'file-storage', modelValue: {} },
    });
    const rows = wrapper.findAllComponents({ name: 'ScFilterFieldRow' });
    await rows[0].vm.$emit('update', 'X');
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
  });
});