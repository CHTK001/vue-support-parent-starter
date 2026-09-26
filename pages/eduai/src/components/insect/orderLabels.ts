/**
 * 目 slug → 中文名。
 *
 * insect-world 的数据里 order 是中立键（'coleoptera' 等），显示名由它的 i18n 层
 * 负责；这里在本系统内自行维护一份，避免为一个映射表引入整套 i18n。
 * 键与显示名必须分开：早先把中文字面量当键用过，英文界面一来筛选就崩。
 */
export const ORDER_LABELS: Record<string, string> = {
  coleoptera: "鞘翅目",
  lepidoptera: "鳞翅目",
  hymenoptera: "膜翅目",
  diptera: "双翅目",
  hemiptera: "半翅目",
  orthoptera: "直翅目",
  odonata: "蜻蜓目",
  mantodea: "螳螂目",
  neuroptera: "脉翅目",
  blattodea: "蜚蠊目",
  phasmatodea: "竹节虫目",
  dermaptera: "革翅目",
  megaloptera: "广翅目",
  trichoptera: "毛翅目",
};

/** 变态类型 slug → 中文名 */
export function metamorphosisLabel(value?: string): string {
  if (value === "complete") return "完全变态";
  if (value === "incomplete") return "不完全变态";
  return "—";
}

/**
 * 身体部位分组 → 中文名。
 *
 * 用于「跳到同样有某部位的其它虫」：hotspot.anchor（如 elytra）先归到部位组，
 * 再在名录里找下一只也有该部位的物种。
 */
export const PART_LABELS: Record<string, string> = {
  horn: "头角",
  thoraxHorn: "胸角",
  elytra: "鞘翅",
  wing: "翅",
  forewing: "前翅",
  hindwing: "后翅",
  eye: "复眼",
  antenna: "触角",
  foreleg: "前足",
  midleg: "中足",
  hindleg: "后足",
  leg: "足",
  proboscis: "口器",
  abdomen: "腹部",
  thorax: "胸部",
  head: "头部",
  stinger: "螫针",
  ovipositor: "产卵器",
  tympanum: "鼓膜",
  tymbal: "发音器",
  lantern: "发光器",
  forceps: "尾铗",
  rostrum: "长吻",
  mandible: "大颚",
  clypeus: "唇基",
  pronotum: "前胸背板",
  palp: "触须",
  cercus: "尾须",
  haltere: "平衡棒",
  pollenBasket: "花粉篮",
  stridulator: "发音器",
  tympanal: "听器",
  beak: "喙",
};

/** anchor → 部位组名（找不到时返回空串） */
export function partLabel(anchor: string): string {
  return PART_LABELS[anchor] ?? "";
}
