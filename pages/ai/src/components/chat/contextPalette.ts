/**
 * 上下文分类配色（卡其色系）。
 *
 * <p>五个 breakdown 分类原先各自借用 Element Plus 语义令牌
 * （--el-color-primary / danger / info / success / warning），
 * 落到「上下文窗口」的拼贴面积图与 200 格点阵上，就是一块蓝、一块红、一块灰、
 * 一块绿、一块橙 —— 色彩噪音盖过了面积本身（用户口径 2026-11-16：太难看，改卡其色）。</p>
 *
 * <p>改法：收成同一色相（卡其）由深到浅五档。低饱和暖中性色与任何皮肤都不冲突，
 * 分类之间靠明度差区分；不再逐档写 var(--el-color-*)，换肤时也不会跳回高饱和语义色。</p>
 *
 * <p>这份常量是唯一出处：执行轨迹 → 上下文窗口（图表 + 分类胶囊 + 明细行内色点）、
 * 侧栏会话悬停卡的迷你 treemap 都读它，避免两处各写一套又走色。</p>
 */
export const CONTEXT_KHAKI = {
  /** 系统提示词：最深一档，压在拼贴图左上方最稳 */
  systemPrompt: "#9C8659",
  /** 工具定义：中深，与系统提示词相邻时靠明度分开 */
  tools: "#C6B189",
  /** 摘要：最浅一档，占比通常小，浅色不会在深块边上抢眼 */
  summary: "#DDD0AF",
  /** 用户输入：五档里最深，一眼能认出「这一轮问的是什么」 */
  userPrompt: "#7C6A45",
  /** 对话消息：中间调，面积通常最大，做背景层不刺眼 */
  history: "#B4A077",
} as const;

/**
 * 明细里的两个附加视图：文件 / 工具结果。
 *
 * <p>它们不是 breakdown 的独立分类（是会话内容的子集，不重复计入占比），
 * 所以取比五档更浅的一档卡其，出现在明细列表时不与分类色争位置。</p>
 */
export const CONTEXT_KHAKI_EXTRA = {
  files: "#D3C3A0",
  toolResult: "#BFA87F",
} as const;

/** breakdown 的五个键，与后端 token-stats 返回的 breakdown 字段一一对应 */
export type ContextBreakdownKey = keyof typeof CONTEXT_KHAKI;
