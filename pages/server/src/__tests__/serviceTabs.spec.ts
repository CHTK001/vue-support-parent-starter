import { describe, expect, it } from 'vitest';
import {
  buildSearchFields,
  buildStatusTabs,
  countBySlot,
  emptySearchModel,
  hasSearchCondition,
  type StatusSlot,
} from '../utils/serviceTabs';
import { filterNodes, summarizeNodes } from '../utils/nodeList';
// ServerNodeView 由 api/serviceManage 声明，nodeList 只转引不导出（见 utils/serviceTabs.ts 同名说明）
import type { ServerNodeView } from '../api/serviceManage';

/**
 * 服务页页签与搜索区。
 *
 * <p>这里钉的是「计数」与「筛选结果」的一致性：页签说有几行，点进去就必须
 * 有几行。这类不一致在界面上很难看出来，但用户会直接认为列表坏了。</p>
 */

/** 造一个最小可用节点 */
function node(over: Partial<ServerNodeView>): ServerNodeView {
  return {
    id: 1,
    name: 'svc',
    protocol: 'tcp-proxy',
    host: '0.0.0.0',
    port: 19080,
    status: 'RUNNING',
    ...over,
  } as ServerNodeView;
}

const fixtures: ServerNodeView[] = [
  node({ id: 1, name: 'alpha', protocol: 'tcp-proxy', status: 'RUNNING' }),
  node({ id: 2, name: 'beta', protocol: 'http-proxy', status: 'STOPPED' }),
  node({ id: 3, name: 'gamma', protocol: 'http-proxy', status: 'ERROR' }),
  node({ id: 4, name: 'delta', protocol: 'tcp-proxy', status: 'RUNNING' }),
];

describe('buildStatusTabs 状态页签', () => {
  it('常态只出四档：全部/运行中/已停止/异常', () => {
    const tabs = buildStatusTabs(fixtures, summarizeNodes(fixtures));
    expect(tabs.map(t => t.name)).toEqual(['', 'RUNNING', 'STOPPED', 'ERROR']);
    expect(tabs.map(t => t.badge)).toEqual([4, 2, 1, 1]);
  });

  it('没有节点时 badge 为空，不渲染「0」这种噪音', () => {
    const tabs = buildStatusTabs([], summarizeNodes([]));
    expect(tabs.every(t => t.badge === null)).toBe(true);
  });

  it('存在未知状态节点时才追加「未知」档', () => {
    const withUnknown = [...fixtures, node({ id: 5, status: 'STARTING' })];
    const tabs = buildStatusTabs(withUnknown, summarizeNodes(withUnknown));
    expect(tabs.map(t => t.name)).toContain('UNKNOWN');
    expect(tabs.find(t => t.name === 'UNKNOWN')?.badge).toBe(1);
  });

  it('未知档在统计为 0 时不出现', () => {
    const tabs = buildStatusTabs(fixtures, summarizeNodes(fixtures));
    expect(tabs.map(t => t.name)).not.toContain('UNKNOWN');
  });
});

describe('页签计数与筛选结果一致', () => {
  const slots: StatusSlot[] = ['', 'RUNNING', 'STOPPED', 'ERROR', 'UNKNOWN'];

  it.each(slots)('档位 %s 的计数等于点开后的行数', slot => {
    const count = countBySlot(fixtures, slot);
    const rows = filterNodes(fixtures, { status: slot });
    expect(rows.length).toBe(count);
  });

  it('「全部」等于节点总数', () => {
    expect(countBySlot(fixtures, '')).toBe(fixtures.length);
  });

  it('空状态字段的节点归入未知档，不会凭空消失', () => {
    const withBlank = [node({ id: 9, status: '' })];
    expect(countBySlot(withBlank, 'UNKNOWN')).toBe(1);
    expect(filterNodes(withBlank, { status: 'UNKNOWN' })).toHaveLength(1);
  });

  it('未知档只收非枚举状态，不把 RUNNING 也算进去', () => {
    expect(countBySlot(fixtures, 'UNKNOWN')).toBe(0);
  });
});

describe('状态与搜索条件叠加', () => {
  it('状态 + 关键字是「且」的关系', () => {
    const rows = filterNodes(fixtures, { status: 'RUNNING', keyword: 'alpha' });
    expect(rows.map(r => r.name)).toEqual(['alpha']);
  });

  it('状态 + 协议同时生效', () => {
    const rows = filterNodes(fixtures, { status: 'RUNNING', protocol: 'tcp-proxy' });
    expect(rows.map(r => r.name)).toEqual(['alpha', 'delta']);
  });

  it('状态档与协议冲突时返回空，而不是忽略其中一个', () => {
    expect(filterNodes(fixtures, { status: 'STOPPED', protocol: 'tcp-proxy' })).toEqual([]);
  });
});

describe('搜索区配置', () => {
  it('空条件是干净的字符串，不是 undefined（避免 v-model 半受控）', () => {
    expect(emptySearchModel()).toEqual({ keyword: '', protocol: '' });
  });

  it('纯空格不算搜索条件', () => {
    expect(hasSearchCondition({ keyword: '   ', protocol: '' })).toBe(false);
  });

  it('任一条件非空即视为生效', () => {
    expect(hasSearchCondition({ keyword: 'a', protocol: '' })).toBe(true);
    expect(hasSearchCondition({ keyword: '', protocol: 'tcp-proxy' })).toBe(true);
  });

  it('字段配置含关键字与协议两项，协议选项透传', () => {
    const fields = buildSearchFields([{ label: 'TCP 代理', value: 'tcp-proxy' }]);
    expect(fields.map(f => f.key)).toEqual(['keyword', 'protocol']);
    expect(fields[1].options).toEqual([{ label: 'TCP 代理', value: 'tcp-proxy' }]);
  });

  it('协议元数据为空时字段仍存在，只是没有选项', () => {
    const fields = buildSearchFields([]);
    expect(fields).toHaveLength(2);
    expect(fields[1].options).toEqual([]);
  });
});
