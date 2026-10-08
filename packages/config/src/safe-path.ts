/**
 * 远程/外部配置写入的安全路径工具。
 *
 * <p><b>修复一个原型链污染（Prototype Pollution）缺陷。</b></p>
 *
 * <p>原实现在两处用「按点号拆键 → 逐层下钻 → 赋值」把后端配置写进对象：</p>
 * <pre>{@code
 * const keys = pathKey.split(".");
 * let cur = partial;
 * for (let i = 0; i < keys.length - 1; i++) {
 *   const key = keys[i];
 *   if (typeof cur[key] !== "object" || cur[key] === null) cur[key] = {};
 *   cur = cur[key];              // ← 问题在这里
 * }
 * cur[keys[keys.length - 1]] = value;
 * }</pre>
 *
 * <p>下钻时读的是 <b>继承链</b>上的属性，而不是自有属性。对 {@code __proto__}
 * 而言，{@code cur["__proto__"]} 恒为 {@code Object.prototype}
 * （typeof 为 {@code "object"}，非 null），于是判空通过、{@code cur} 被赋成
 * {@code Object.prototype}，最后一行就写到了 <b>全局原型</b> 上：</p>
 * <pre>{@code
 * // sysSettingCode = "__proto__.isAdmin"
 * → Object.prototype.isAdmin = true
 * }</pre>
 *
 * <p>后果不是「某个对象的属性被改了」，而是<b>任意页面里所有对象都凭空多出该属性</b>：
 * 权限判断里 {@code if (obj.isAdmin)} 恒真、{@code JSON.stringify} 输出多出字段、
 * 部分库的「判断对象是否为空」逻辑被污染而失效。而配置项的 {@code sysSettingCode}
 * 来自数据库里的设置行，任何能写入设置表的人（管理员、被 SQL 注入利用的接口、
 * 导入的第三方配置包）都能触发它。</p>
 *
 * <p>本模块提供两条独立的防线：</p>
 * <ol>
 *   <li><b>禁止段名</b>：{@code __proto__} / {@code prototype} / {@code constructor}
 *       一律拒绝，不做任何「兼容处理」；</li>
 *   <li><b>只认自有属性</b>：下钻时用 {@code hasOwnProperty} 判断，
 *       绝不把继承来的对象当成容器；命中的容器必须是<b>纯对象</b>
 *       （数组、Date 等一律拒绝，避免把值塞进奇怪的结构里）。</li>
 * </ol>
 */

/**
 * 永远不允许出现在配置路径里的段名。
 *
 * <p>{@code __proto__} 直接导致全局污染；{@code prototype} 与 {@code constructor}
 * 则是构造链上的等价入口（例如 {@code constructor.prototype.x}），一并堵死。</p>
 */
export const FORBIDDEN_PATH_SEGMENTS: ReadonlySet<string> = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

/**
 * 远程配置<b>允许写入</b>的顶层键。
 *
 * <p>远程设置接口的定位是「管理员可调的品牌 / 展示 / 功能开关」，
 * 而不是「任意配置项」。原实现对顶层键完全不设限，于是远程配置可以改写：</p>
 * <ul>
 *   <li>{@code http.baseURL} —— 把全部 API 请求指向攻击者主机，
 *       用户在自家页面上输入的口令会直接发到对方手里；</li>
 *   <li>{@code token.*Key} —— 改写令牌存储位置，与登录态劫持配合；</li>
 *   <li>{@code crypto.*} / {@code security.*} —— 远程关掉签名或校验开关。</li>
 * </ul>
 *
 * <p>白名单里的每一项都对应「改了只会影响观感/布局」的安全域；
 * {@code token}、{@code http}、{@code crypto}、{@code security}、{@code storage}、
 * {@code url}、{@code config} 均<b>不在</b>其中——需要改这些请改本地
 * {@code app.yaml} 或环境变量，那才是管理员真正该动的地方。</p>
 */
export const REMOTE_INJECTABLE_TOP_KEYS: ReadonlySet<string> = new Set([
  "app",
  "env",
  "i18n",
  "layout",
  "login",
  "menu",
  "message",
  "monitor",
  "other",
  "permission",
  "route",
  "socket",
  "system",
  "upload",
]);

/**
 * 远程配置<b>允许写入的完整路径前缀</b>（顶层键之外的细粒度放行）。
 *
 * <p>{@code security} 整体不可远程注入（见上），但平台的反爬脚本下发
 * （{@code security.baiduJs.*}：enable/action/jumpUrl/url）就是设计为
 * 「管理员在后台配置、前端按下发值注入外部脚本」的产品功能，
 * 会被 {@code /v2/setting/default} 正常下发。若连它一起拒，
 * 后台配置的反爬策略在前端永远不生效（e2e security-config 04/05/06 复现的正是该缺陷）。</p>
 *
 * <p>只放行 {@code security.baiduJs} 这一棵子树：
 * {@code security.csrf} / {@code security.xxx} 等其余键照旧被白名单拦下。</p>
 */
export const REMOTE_INJECTABLE_PATH_PREFIXES: ReadonlySet<string> = new Set([
  "security.baiduJs",
]);


/** 判断是否为「纯对象」（排除 null、数组、以及 Date/Map/Set 等内建类型） */
function isPlainContainer(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * 路径是否含禁止段名
 *
 * @param segments 路径段
 * @return 含禁止段名返回 true
 */
export function hasForbiddenSegment(segments: readonly string[]): boolean {
  return segments.some((seg) => FORBIDDEN_PATH_SEGMENTS.has(seg));
}

/** 安全写入选项 */
export interface SafeSetOptions {
  /**
   * 顶层键白名单；传入后不在白名单内的顶层键会被拒绝。
   * 不传表示不限制（仅用于可信的本地 app.yaml 解析路径）。
   */
  topKeyAllowlist?: ReadonlySet<string>;
  /**
   * 完整路径前缀白名单（如 {@code security.baiduJs}）。
   * 顶层键不在 topKeyAllowlist 时先比对本表：路径等于前缀、或以「前缀.」开头即放行，
   * 用于「顶层键整体不可远程注入，但个别子树是产品功能」的场景。
   */
  pathPrefixAllowlist?: ReadonlySet<string>;
  /** 归一化顶层键（如 appConfig → app），白名单比对前调用 */
  normalizeTopKey?: (key: string) => string;
  /** 拒绝时的回调（便于告警与排障） */
  onReject?: (path: string, reason: string) => void;
}

/**
 * 按点号路径安全地写入值。
 *
 * <p>与原实现的关键差异：</p>
 * <ul>
 *   <li>先整条路径校验（禁止段名 + 顶层白名单），<b>不合格一个字节都不写</b>；</li>
 *   <li>下钻只认自有属性，且要求是纯对象，绝不进入继承链；</li>
 *   <li>中间层不存在时创建<b>自有</b>的普通对象。</li>
 * </ul>
 *
 * @param target 目标对象（原地修改）
 * @param dottedPath 点号路径，如 {@code login.brandName}
 * @param value 值
 * @param options 选项
 * @return 写入成功返回 true；被拒绝返回 false（target 未发生任何变化）
 */
export function safeSetDotted(
  target: Record<string, unknown>,
  dottedPath: string,
  value: unknown,
  options: SafeSetOptions = {},
): boolean {
  const reject = (reason: string): boolean => {
    options.onReject?.(dottedPath, reason);
    return false;
  };

  if (typeof dottedPath !== "string") return reject("路径不是字符串");
  const trimmed = dottedPath.trim();
  if (!trimmed) return reject("路径为空");

  const rawSegments = trimmed.split(".");
  if (rawSegments.some((seg) => seg === "")) return reject("路径含空段");
  if (hasForbiddenSegment(rawSegments)) {
    return reject("路径含原型链相关段名（__proto__ / prototype / constructor）");
  }

  let segments = rawSegments;
  const allowlist = options.topKeyAllowlist;
  if (allowlist) {
    const normalize = options.normalizeTopKey;
    const topRaw = segments[0];
    const top = normalize ? normalize(topRaw) : topRaw;
    if (top !== topRaw) segments = [top, ...segments.slice(1)];
    const normalizedPath = segments.join(".");
    const inPrefixAllow =
      options.pathPrefixAllowlist != null &&
      [...options.pathPrefixAllowlist].some(
        (p) => normalizedPath === p || normalizedPath.startsWith(`${p}.`),
      );
    if (!allowlist.has(top) && !inPrefixAllow) {
      return reject(`顶层键 "${top}" 不在远程可注入白名单内`);
    }
  }

  const leaf = segments[segments.length - 1];
  let cur: Record<string, unknown> = target;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const existing = Object.prototype.hasOwnProperty.call(cur, key) ? cur[key] : undefined;
    if (existing === undefined) {
      const created: Record<string, unknown> = {};
      cur[key] = created;
      cur = created;
      continue;
    }
    // 只允许下钻进「自有」的纯对象：继承来的（如 __proto__）与数组/内建实例一律停手
    if (!isPlainContainer(existing)) {
      return reject(`路径段 "${key}" 处的值不是可下钻的普通对象`);
    }
    cur = existing;
  }

  // 叶节点同样不能是禁止段名（上面已整体校验，这里是防止未来改动漏掉）
  if (FORBIDDEN_PATH_SEGMENTS.has(leaf)) {
    return reject("叶节点为原型链相关段名");
  }
  cur[leaf] = value;
  return true;
}

/**
 * 安全地把「顶层键 → 值」平铺对象拷进目标对象（用于远程 JSON 对象整体合并）。
 *
 * <p>逐键走 {@link safeSetDotted}，因此同样受禁止段名与顶层白名单约束。
 * 与原 {@code normalizeTopLevelKeys} 的区别：原实现用
 * {@code result[key] = data[key]}，当 key 为 {@code __proto__} 时会改写
 * {@code result} 的原型（虽不污染全局，但会把配置对象变成一个诡异的实例）。</p>
 *
 * @param target 目标对象（原地修改）
 * @param source 源对象
 * @param options 选项
 * @return 实际写入的键数量
 */
export function safeAssignTopLevel(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  options: SafeSetOptions = {},
): number {
  let written = 0;
  for (const key of Object.keys(source)) {
    if (safeSetDotted(target, key, source[key], options)) written++;
  }
  return written;
}
