/**
 * 「AI 正在思考…」占位文案库。
 *
 * <p>用途：AI 答复的**首字还没回来**时，气泡里不能是一片空白 —— 那里先给一句
 * 随机文案 + 动画（见 {@code message-item/ThinkingPlaceholder.vue}），
 * 等第一个 token 到了再由正文顶替。</p>
 *
 * <p>文案从哪里来：**会话管理（设置中心 → 会话配置）**。用户在那边填的列表
 * 会通过 {@link setCustomThinkingPhrases} 灌进来；没填/填空了就用本文件里的
 * 内置默认列表（{@link DEFAULT_THINKING_PHRASES}）。这样"搞怪说明"是产品默认值，
 * 同时保留让用户自己改的入口，不是写死在组件里的死文案。</p>
 *
 * <p>为什么随机而不是固定一句：长时间等待时同一句反复出现会像卡住。
 * {@link pickThinkingPhrase} 会避开"上一句"，保证不会连着两次一样。</p>
 */

/**
 * 内置默认文案（产品默认值）。
 *
 * <p>语气刻意写成「自己嘀咕」而不是「请稍候」这类系统播报 —— 用户要的是
 * 一点活人味，不是又一条 loading 提示。长度控制在 12 字上下，单行不换行。</p>
 */
export const DEFAULT_THINKING_PHRASES: string[] = [
  // 默认那句不带省略号：后面的「…」由用户按需自己加（用户明确要求去掉）
  'AI 正在思考',
  '正在翻阅小抄…',
  '脑子转得有点烫…',
  '在记忆里翻箱倒柜…',
  '正在把话说圆…',
  '先让我捋一捋…',
  '正在和上下文搏斗…',
  '草稿写了三版，正在删…',
  '正在估摸你想问什么…',
  '正在把碎片拼成一句人话…',
  '正在假装很镇定…',
  '正在确认自己没跑题…',
  '正在犹豫要不要用术语…',
  '正在给自己打草稿…',
  '正在从零重排一下思路…',
  '正在数这句话有几个字…',
  '快好了，真的…',
  '再等等，快了…',
  '正在翻白眼，但没有表情包',
  '心跳 100，键盘很凉',
  '正在假装自己是人',
  '正在删掉刚写的一句废话',
  '摸鱼被抓，立刻正经起来',
  '正在给答案挑毛病',
  '先把话说短一点…再短一点…',
  '正在把「不知道」咽回去',
  '正在怀疑你问的是不是陷阱题',
  '思路走到一半，回去捡一下',
  '正在把标点符号摆正',
  '正在和向量库对暗号…',
  '正在检查自己有没有幻觉',
  '正在厕所门口排队想事情',
  '正在把话从嘴里捞出来',
];

/** 用户自定义列表（会话管理里配置的）。空 = 用内置默认。 */
let customPhrases: string[] = [];

/**
 * 把外部输入（设置项里的字符串数组 / 多行文本 / 单个字符串）规整成可用列表。
 *
 * <p>设置项可能来自后端 JSON、用户手填的多行文本，或历史脏数据，
 * 这里一律 trim、去空行、去重、限长，避免把一整段话当一句文案塞进气泡。</p>
 *
 * @param input 原始输入
 * @returns 规整后的文案列表（可能为空）
 */
export function normalizeThinkingPhrases(input: unknown): string[] {
  let raw: unknown[] = [];
  if (Array.isArray(input)) {
    raw = input;
  } else if (typeof input === 'string') {
    raw = input.split(/\r?\n/);
  } else if (input && typeof input === 'object') {
    raw = Object.values(input as Record<string, unknown>);
  }
  const out: string[] = [];
  for (const item of raw) {
    const text = String(item ?? '').trim().slice(0, 40);
    if (!text) continue;
    if (!out.includes(text)) out.push(text);
  }
  return out;
}

/**
 * 设置用户自定义文案列表（会话管理保存后调用）。
 *
 * @param input 原始输入，传空则回退到内置默认列表
 */
export function setCustomThinkingPhrases(input: unknown): void {
  customPhrases = normalizeThinkingPhrases(input);
}

/**
 * 当前生效的文案列表：用户配过就用用户的，否则用内置默认。
 *
 * @returns 非空文案列表
 */
export function getThinkingPhrases(): string[] {
  return customPhrases.length > 0 ? customPhrases : DEFAULT_THINKING_PHRASES;
}

/**
 * 随机取一句，尽量避开上一句。
 *
 * @param phrases 可选文案列表（为空时回退到当前生效列表）
 * @param avoid   上一句（避免连着两次相同）
 * @returns 选中的文案
 */
export function pickThinkingPhrase(phrases?: string[], avoid?: string): string {
  const list = phrases && phrases.length > 0 ? phrases : getThinkingPhrases();
  if (list.length === 0) return 'AI 正在思考';
  if (list.length === 1) return list[0];
  for (let i = 0; i < 8; i++) {
    const candidate = list[Math.floor(Math.random() * list.length)];
    if (candidate !== avoid) return candidate;
  }
  // 兜底：随机几次都撞上同一句（列表很短时大概率），直接取下一句
  const idx = list.indexOf(avoid ?? '');
  return list[(idx + 1) % list.length];
}
