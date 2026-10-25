/**
 * 服务管理展示层单测
 *
 * <p>这一层算的是「一个节点该显示成什么」：端口文本、过滤器链的顺序与启用态、
 * 反向代理后端地址、config 里除后端之外的键。算错不会报错，只会让页面安静地说错话
 * —— 例如把 {@code order=2} 的插件排在 {@code order=1} 前面，等于把请求的执行顺序
 * 讲反了；或者把停用的插件当成启用的，排障时就会去排查一个根本没有运行的插件。</p>
 */
import { describe, expect, it } from 'vitest'
import type { FilterTypeMeta, ServerNodeView } from '../api/serviceManage'
import {
  backendTextOf,
  chainOf,
  configPairsOf,
  primaryActionOf,
  stateClassOf,
  toServiceNodeCard,
  toServiceNodeCards,
  typeDescMap,
} from '../views/service/serviceView'

/**
 * 造一个后端会返回的节点
 *
 * @param patch 覆盖字段
 */
function node(patch: Partial<ServerNodeView> = {}): ServerNodeView {
  return {
    id: 5,
    name: 'fs-demo',
    protocol: 'http',
    protocolDesc: 'HTTP 服务',
    engine: 'jdk',
    host: '0.0.0.0',
    port: 19080,
    enabled: 1,
    remark: '演示用',
    status: 'RUNNING',
    serverUrl: 'http://0.0.0.0:19080/',
    ...patch,
  }
}

const FILTER_TYPES: FilterTypeMeta[] = [
  { type: 'file-storage', desc: '文件服务器插件' },
  { type: 'rate-limit', desc: '限流插件' },
]

describe('typeDescMap', () => {
  it('插件类型映射到描述', () => {
    expect(typeDescMap(FILTER_TYPES).get('file-storage')).toBe('文件服务器插件')
  })

  it('元数据缺失或非数组时给空表，不抛错', () => {
    expect(typeDescMap(null).size).toBe(0)
    expect(typeDescMap(undefined).size).toBe(0)
  })
})

describe('toServiceNodeCard', () => {
  it('端口与监听地址按后端字段渲染', () => {
    const card = toServiceNodeCard(node())
    expect(card.portText).toBe('19080')
    expect(card.listenText).toBe('0.0.0.0:19080')
    expect(card.url).toBe('http://0.0.0.0:19080/')
  })

  it('没有端口时端口显示为破折号，不是空串（空端口是要被看见的定义缺失）', () => {
    const card = toServiceNodeCard(node({ port: undefined }))
    expect(card.portText).toBe('—')
    expect(card.listenText).toBe('0.0.0.0:-')
  })

  it('名称 / 协议 / 引擎 / host 缺失时都有兜底，不留空白', () => {
    const card = toServiceNodeCard(
      node({ name: '', protocolDesc: undefined, engine: '  ', host: undefined }),
    )
    expect(card.name).toBe('节点 5')
    expect(card.protocolText).toBe('http')
    expect(card.engine).toBe('—')
    expect(card.host).toBe('0.0.0.0')
  })

  it('自动启用按 enabled=1 判定，文案区分随进程启动与手动启动', () => {
    expect(toServiceNodeCard(node({ enabled: 1 })).enabledText).toBe('随进程启动')
    expect(toServiceNodeCard(node({ enabled: 0 })).enabledText).toBe('手动启动')
    expect(toServiceNodeCard(node({ enabled: 0 })).enabled).toBe(false)
  })

  it('异常节点带出失败原因，其余状态即使有 error 文本也不展示', () => {
    const error = toServiceNodeCard(node({ status: 'ERROR', error: ' 端口被占用 ' }))
    expect(error.statusText).toBe('异常')
    expect(error.reason).toBe('端口被占用')

    const running = toServiceNodeCard(node({ status: 'RUNNING', error: '历史残留' }))
    expect(running.reason).toBe('')
  })

  it('反向代理节点带出后端地址，并把后端键从 config 键值里剔除', () => {
    const card = toServiceNodeCard(
      node({ protocol: 'http-proxy', config: { backendHost: '127.0.0.1', backendPort: 8112 } }),
    )
    expect(card.isProxy).toBe(true)
    expect(card.backendText).toBe('→ 127.0.0.1:8112')
    expect(card.configPairs).toEqual([])
  })

  it('普通节点没有后端地址时给空串，模板据此判断是否展示', () => {
    expect(toServiceNodeCard(node({ config: {} })).backendText).toBe('')
    expect(toServiceNodeCard(node()).backendText).toBe('')
  })

  it('没有过滤器时链路为空，且生效数为 0', () => {
    const card = toServiceNodeCard(node({ filters: undefined }))
    expect(card.chips).toEqual([])
    expect(card.filterCount).toBe(0)
    expect(card.activeFilterCount).toBe(0)
  })

  it('统计生效插件数：挂了 3 个、停用 1 个就是 2', () => {
    const card = toServiceNodeCard(
      node({
        filters: [
          { name: 'a', type: 'file-storage', order: 1 },
          { name: 'b', type: 'rate-limit', order: 2 },
          { name: 'c', type: 'rate-limit', order: 3, enabled: false },
        ],
      }),
    )
    expect(card.filterCount).toBe(3)
    expect(card.activeFilterCount).toBe(2)
  })
})

describe('chainOf', () => {
  it('按 order 升序排列：顺序就是请求穿过插件的顺序', () => {
    const chips = chainOf(
      [
        { name: 'b', type: 'rate-limit', order: 2 },
        { name: 'a', type: 'file-storage', order: 1 },
      ],
      typeDescMap(FILTER_TYPES),
    )
    expect(chips.map(chip => chip.text)).toEqual(['文件服务器插件', '限流插件'])
    expect(chips.map(chip => chip.order)).toEqual([1, 2])
  })

  it('后端没给 order 时按数组位置补位，且排在给了 order 的后面', () => {
    const chips = chainOf(
      [{ name: 'x', type: 'rate-limit' }, { name: 'y', type: 'file-storage', order: 1 }],
      new Map(),
    )
    expect(chips.map(chip => chip.order)).toEqual([1, 2])
    // 后一个参数 order=1 排在前面（x 的补位是 1，按下标稳定排序后 x 仍在后）
    expect(chips.map(chip => chip.key)).toEqual(['y@1', 'x@0'])
  })

  it('保留原始下标：深度查看页要按它在节点 filters 里的位置取', () => {
    const chips = chainOf(
      [
        { name: 'b', type: 'rate-limit', order: 2 },
        { name: 'a', type: 'file-storage', order: 1 },
      ],
      new Map(),
    )
    expect(chips[0].index).toBe(1)
    expect(chips[1].index).toBe(0)
  })

  it('没给 enabled 视为启用，显式 false 才算停用（停用的插件不能藏起来）', () => {
    const chips = chainOf(
      [{ name: 'a', type: 'rate-limit' }, { name: 'b', type: 'rate-limit', enabled: false }],
      new Map(),
    )
    expect(chips[0].enabled).toBe(true)
    expect(chips[1].enabled).toBe(false)
  })

  it('描述缺失时退回类型，再退回归属名', () => {
    const chips = chainOf(
      [{ name: 'only-name' }, { name: 'n2', type: 'unknown-type' }],
      typeDescMap(FILTER_TYPES),
    )
    expect(chips[0].text).toBe('only-name')
    expect(chips[1].text).toBe('unknown-type')
  })

  it('统计参数条数，便于看出「挂了个空插件」', () => {
    const chips = chainOf(
      [{ name: 'a', type: 'rate-limit', params: { qps: '10', burst: '20' } }, { name: 'b' }],
      new Map(),
    )
    expect(chips[0].paramCount).toBe(2)
    expect(chips[1].paramCount).toBe(0)
  })

  it('空列表与非数组都给空链路', () => {
    expect(chainOf([], new Map())).toEqual([])
    expect(chainOf(undefined, new Map())).toEqual([])
  })
})

describe('backendTextOf / configPairsOf', () => {
  it('只有 host 或只有 port 时缺的一侧显示破折号，不吞掉已有信息', () => {
    expect(backendTextOf({ backendHost: '10.0.0.2' })).toBe('→ 10.0.0.2:—')
    expect(backendTextOf({ backendPort: 8080 })).toBe('→ —:8080')
  })

  it('两个键都没有时返回空串', () => {
    expect(backendTextOf({})).toBe('')
    expect(backendTextOf(null)).toBe('')
  })

  it('config 其余键转成文本，空值跳过，对象序列化', () => {
    expect(
      configPairsOf({ a: 1, b: '', c: null, d: { x: 1 }, backendHost: 'h', backendPort: 1 }),
    ).toEqual([
      { key: 'a', value: '1' },
      { key: 'd', value: '{"x":1}' },
    ])
  })
})

describe('toServiceNodeCards', () => {
  it('批量映射，空输入给空数组', () => {
    expect(toServiceNodeCards(null, FILTER_TYPES)).toEqual([])
    expect(toServiceNodeCards([node({ id: 1 }), node({ id: 2 })], FILTER_TYPES)).toHaveLength(2)
  })

  it('插件描述的映射对整批生效', () => {
    const cards = toServiceNodeCards(
      [node({ filters: [{ name: 'f', type: 'file-storage', order: 1 }] })],
      FILTER_TYPES,
    )
    expect(cards[0].chips[0].text).toBe('文件服务器插件')
  })
})

describe('stateClassOf / primaryActionOf', () => {
  it('三档状态各自对应一个样式类', () => {
    expect(stateClassOf(toServiceNodeCard(node({ status: 'RUNNING' })))).toBe('is-run')
    expect(stateClassOf(toServiceNodeCard(node({ status: 'ERROR' })))).toBe('is-err')
    expect(stateClassOf(toServiceNodeCard(node({ status: 'STOPPED' })))).toBe('is-stop')
  })

  it('运行中的主操作是停，异常的给重启，其余给启动', () => {
    expect(primaryActionOf(toServiceNodeCard(node({ status: 'RUNNING' })))).toBe('stop')
    expect(primaryActionOf(toServiceNodeCard(node({ status: 'ERROR' })))).toBe('restart')
    expect(primaryActionOf(toServiceNodeCard(node({ status: 'STOPPED' })))).toBe('start')
  })
})
