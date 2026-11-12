/**
 * 网关接管渠道的<b>界面元数据</b>：预设 id、接管插件的 npm 规格。
 *
 * <p><b>这张表不再记录 provider id</b>。某个渠道在网关里对应哪些上游 provider，
 * 唯一真值在后端（{@code ChannelUpstreamAdmin#ownedChannels}，magpie 的实现是
 * {@code MagpieSupport.VENDOR_PROVIDERS}），随 {@code GET /api/channels} 的
 * {@code ownedChannels} 一起下发。此前前端也留了一份同样的对照表，网关改一次
 * provider 命名，页面就静默滑回「待接入」，而且没有任何报错。</p>
 *
 * <p>这里只保留网关接口没有、纯属界面选择的两件事：</p>
 * <ul>
 *   <li>{@code preset}：网关里还没有上游时，「新增上游」预填哪个 magpie 预设；</li>
 *   <li>{@code plugin}：没有预设可预填时，去「插件」页签置顶哪个接管插件。</li>
 * </ul>
 *
 * <p>某个渠道只在 {@code ownedChannels} 里出现、这里没有条目也是正常的：那时
 * 点开会落到「上游」页签，由网关面板自己决定接哪条上游。</p>
 */
export interface MagpieOwnedVendor {
  /** 我们这边的渠道 id（{@code /api/channels} 的 channel 字段） */
  channel: string
  /**
   * 网关里还没有该渠道的任何上游时，「新增上游」预填的 magpie preset id。
   *
   * <p>留空表示该渠道只可能由插件接管，不做预填（插件没装时给出空表）。</p>
   */
  preset?: string
  /**
   * 接管该渠道登录的 magpie 插件 npm 规格（{@code magpiePlugins.ts} 里的 {@code spec}）。
   *
   * <p>点这个子项时：网关里已有上游 → 去「上游」高亮；没有上游但有 {@link preset}
   * → 去「上游」打开新增并预填；两者都没有 → 去「插件」页签，把这个插件置顶并
   * 给出「安装」入口。绝不自动安装。</p>
   */
  plugin?: string
}

export const MAGPIE_OWNED_VENDORS: MagpieOwnedVendor[] = [
  { channel: 'workbuddy', plugin: '@magpie-community/opencode-workbuddy-auth' },
  { channel: 'zcode', plugin: '@magpie-community/opencode-zcode-auth' },
  { channel: 'qoder', plugin: '@magpie-community/opencode-qoder-auth' },
  { channel: 'qoder-cn', plugin: '@magpie-community/opencode-qoder-auth' },
  { channel: 'trae', plugin: '@magpie-community/opencode-trae-auth' },
  { channel: 'minimax', plugin: '@magpie-community/opencode-minimax-auth' },
  // 下面 3 个只有插件、没有预设：点开是「插件」页签，装完插件才谈得上下游。
  { channel: 'loomy', plugin: '@magpie-community/opencode-loomy-auth' },
  { channel: 'lobsterai', plugin: 'magpie-providers-hub' },
  { channel: 'raccoon', plugin: '@magpie-community/opencode-raccoon-auth' },
  // 以下 4 个走 magpie 预设：不接管登录，接管上游地址 / key / 模型目录。
  { channel: 'opencode', preset: 'opencode-zen' },
  { channel: 'kilo', preset: 'kilo' },
  { channel: 'cline', preset: 'clinepass', plugin: '@magpie-community/opencode-cline-auth' },
  { channel: 'gemini', preset: 'google' },
]

/** 渠道 id → 界面元数据；不认识的返回 undefined（不认识不代表没被网关接管） */
export function magpieOwnedOf(channel: string): MagpieOwnedVendor | undefined {
  return MAGPIE_OWNED_VENDORS.find((v) => v.channel === channel)
}
