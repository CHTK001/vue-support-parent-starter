/**
 * 左栏里「整体交给 Magpie」的渠道对照表。
 *
 * <p><b>这张表为什么存在</b>：magpie 的账号体系分两拨——</p>
 * <ul>
 *   <li><b>可移交插件</b>：{@code GET /api/providers} 的 {@code movable}/{@code movesTo}
 *       里列出的 vendor（qoder、qoder-cn、workbuddy、workbuddy-ai、zcode …），
 *       登录、签到、额度全部由插件负责；</li>
 *   <li><b>内置账号</b>：magpie 自己实现了签到端点
 *       {@code POST /api/usage/{vendor}-checkin} 的 vendor（workbuddy / trae /
 *       minimax / qoder，见后端 {@code MagpieSupport.CHECKIN_VENDORS}）。</li>
 * </ul>
 *
 * <p>除了上面两拨，magpie 还内置了一批 <b>预设</b>（{@code /api/providers} 的
 * {@code presets}）：{@code opencode-zen/opencode-go}、{@code kilo}、
 * {@code clinepass}、{@code google/google-vertex} …。这些渠道 magpie 不接管登录，
 * 但接管「上游地址 + key + 模型目录」，所以同样收进本表：网关里已经有对应上游时
 * 点子项直接定位；没有时点子项打开「新增上游」并按 {@link MagpieOwnedVendor.preset}
 * 预填，用户只补一个 API Key。</p>
 *
 * <p><b>维护方式</b>：magpie 升级后新增 vendor / preset 时，在这里补一行即可；不补
 * 不会出错，只是该渠道仍按原生实现单独占一行。{@code providers} 是 magpie 侧的
 * provider id，插件接管时可能带 {@code -ai} 后缀（如 workbuddy → workbuddy-ai）；
 * 同一个渠道可能有多条可行路径（如 cline 优先插件 {@code cline}，其次预设
 * {@code clinepass}），按优先级从前往后排。</p>
 */
export interface MagpieOwnedVendor {
  /** 我们这边的渠道 id（{@code /api/channels} 的 channel 字段） */
  channel: string
  /** magpie 侧对应的 provider id，第一个用于定位高亮（其余为备选，如插件 / 预设两种装法） */
  providers: string[]
  /**
   * 网关里还没有任何 {@link providers} 时，「新增上游」预填的 magpie preset id。
   *
   * <p>留空表示该渠道只可能由插件接管，不做预填（插件没装时给出空表）。</p>
   */
  preset?: string
  /**
   * 接管该渠道的 magpie 插件 npm 规格（{@code magpiePlugins.ts} 里的 {@code spec}）。
   *
   * <p>点这个子项时：网关里已有 provider → 去「上游」高亮；没有 provider 但有
   * {@link preset} → 去「上游」打开新增并预填；两者都没有 → 去「插件」页签，
   * 把这个插件置顶并给出「安装」入口。绝不自动安装。</p>
   */
  plugin?: string
}

export const MAGPIE_OWNED_VENDORS: MagpieOwnedVendor[] = [
  { channel: 'workbuddy', providers: ['workbuddy-ai', 'workbuddy'], plugin: '@magpie-community/opencode-workbuddy-auth' },
  { channel: 'zcode', providers: ['zcode'], plugin: '@magpie-community/opencode-zcode-auth' },
  { channel: 'qoder', providers: ['qoder'], plugin: '@magpie-community/opencode-qoder-auth' },
  { channel: 'qoder-cn', providers: ['qoder-cn'], plugin: '@magpie-community/opencode-qoder-auth' },
  { channel: 'trae', providers: ['trae-cn', 'trae-global'], plugin: '@magpie-community/opencode-trae-auth' },
  { channel: 'minimax', providers: ['minimax-code', 'minimax-code-global'], plugin: '@magpie-community/opencode-minimax-auth' },
  // 下面 3 个只有插件、没有预设：点开是「插件」页签，装完插件才谈得上下游。
  { channel: 'loomy', providers: ['loomy', 'hub-loomy'], plugin: '@magpie-community/opencode-loomy-auth' },
  { channel: 'lobsterai', providers: ['hub-lobsterai'], plugin: 'magpie-providers-hub' },
  { channel: 'raccoon', providers: ['raccoon'], plugin: '@magpie-community/opencode-raccoon-auth' },
  // 以下 4 个走 magpie 预设：不接管登录，接管上游地址 / key / 模型目录。
  // 备选 id 覆盖「插件装过」的情况：cline 插件 → `cline`，只有预设时 → `clinepass`。
  { channel: 'opencode', providers: ['opencode-zen', 'opencode-go', 'opencode-zen-free'], preset: 'opencode-zen' },
  { channel: 'kilo', providers: ['kilo'], preset: 'kilo' },
  { channel: 'cline', providers: ['cline', 'clinepass'], preset: 'clinepass', plugin: '@magpie-community/opencode-cline-auth' },
  { channel: 'gemini', providers: ['google', 'google-vertex'], preset: 'google' },
]

/** 渠道 id → 归属条目；不认识的返回 undefined */
export function magpieOwnedOf(channel: string): MagpieOwnedVendor | undefined {
  return MAGPIE_OWNED_VENDORS.find((v) => v.channel === channel)
}
