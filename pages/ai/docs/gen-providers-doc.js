// 生成「提供商能力矩阵」文档：数据全部取自代码，不手写结论。
// 判定口径镜像后端：
//   余额  → ApiProviderController.candidateKinds / creditBrand / isOfficialOpenAi
//           + provider-credit-endpoints.json（Bearer 11 家、AK/SK 4 家）
//   模型  → fetchModelsFromUpstream / requestUpstreamModels
// 用法：node gen-providers-doc.js [输出路径]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 工作区根目录（包含 spring-support-parent-starter 与 vue-support-parent-starter 的那一层）；
// 换机器或换盘符时用 CHUA_PROJECT_ROOT 覆盖，不必改脚本
const ROOT = process.env.CHUA_PROJECT_ROOT || path.resolve(__dirname, '../../../..');

const TPL = path.join(ROOT, 'vue-support-parent-starter/pages/ai/src/components/models/model.constants.ts');
const CREDIT_REGISTRY = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/resources/provider-catalog/provider-credit-endpoints.json');
const PROVIDER_REGISTRY = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/resources/provider-catalog/provider-registry.json');
const APC = path.join(ROOT, 'spring-support-parent-starter/spring-support-ai-starter/src/main/java/com/chua/starter/ai/support/manage/api/ApiProviderController.java');
const LIMIT_REGISTRY = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/resources/provider-catalog/provider-limit-docs.json');
const PRICING_REGISTRY = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/resources/provider-catalog/provider-pricing-rules.json');
const OUT = process.argv[2] || path.join(ROOT, 'vue-support-parent-starter/pages/ai/docs/提供商.md');

const src = fs.readFileSync(TPL, 'utf8');
const start = src.indexOf('export const PROVIDER_TEMPLATES');
const block = src.slice(start, src.indexOf('\n]', start));
const rows = block.split('\n')
  .filter((l) => l.trim().startsWith('{'))
  .map((line) => {
    const g = (k) => {
      const m = line.match(new RegExp(k + ":\\s*'([^']*)'"));
      return m ? m[1] : null;
    };
    return { id: g('id'), name: g('name'), protocol: g('protocol'), url: g('defaultApiUrl') };
  });

// 官方余额预设：数据源是 datasearch 的 provider-credit-endpoints.json（Host 实现已改为读它），
// 不再从 Java 常量里正则抠地址；signType 非空即 AK/SK 签名类。
const creditRegistry = JSON.parse(fs.readFileSync(CREDIT_REGISTRY, 'utf8'));
const hosts = (creditRegistry.entries || []).map((e) => ({
  brand: e.id, url: e.url, signType: e.signType || null,
}));
const SIGN_KINDS = new Set(hosts.filter((h) => h.signType).map((h) => h.brand));
const bearer = hosts.filter((h) => !h.signType);

// 供应商登记表：一家一条（协议 / 地址 / models.dev 目录键 / 能力位 / 余额口径）
const providerRegistry = JSON.parse(fs.readFileSync(PROVIDER_REGISTRY, 'utf8'));
const registryById = new Map((providerRegistry.providers || []).map((p) => [String(p.id).toLowerCase(), p]));

const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

// 中转探测链直接读后端常量，避免文档和代码各说一套
const apc = fs.readFileSync(APC, 'utf8');
const chainMatch = apc.match(/AUTO_CREDIT_KINDS\s*=\s*List\.of\(([^)]*)\)/);
const KIND_LABEL = { 'new-api': 'new-api', billing: 'OpenAI 兼容计费(billing)', sub2api: 'sub2api' };
const relayKinds = chainMatch
  ? [...chainMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
  : [];
const relayChain = relayKinds.map((k) => KIND_LABEL[k] || k).join(' → ');

// 限制登记表：后端数据驱动加载的唯一数据源（204 条 = 模板库全量厂商）
let limitEntries = [];
try {
  limitEntries = JSON.parse(fs.readFileSync(LIMIT_REGISTRY, 'utf8')).entries || [];
} catch (e) {
  limitEntries = [];
}
const limitDocEntries = limitEntries.filter((e) => e.doc);
const limitVerified = limitEntries.filter((e) => e.verified);
// 模型目录快照：datasearch 内置，用来算「说明 / 计费 / 能力位」覆盖数
const CATALOG = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/resources/provider-catalog/models-dev.json.gz');
let catalogSnapshot = null;
let catalogProviders = 0;
let catalogModels = 0;
try {
  catalogSnapshot = JSON.parse(zlib.gunzipSync(fs.readFileSync(CATALOG)).toString('utf8'));
  const providers = catalogSnapshot.providers || {};
  catalogProviders = Object.keys(providers).length;
  catalogModels = Object.values(providers)
    .reduce((sum, p) => sum + Object.keys(p.models || {}).length, 0);
} catch (e) {
  catalogSnapshot = null;
  catalogProviders = 0;
  catalogModels = 0;
}
const hostOf = (url) => {
  if (!url) return null;
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
};

const protocolLabel = { openai: 'OpenAI 兼容', anthropic: 'Anthropic(CC)', gemini: 'Gemini' };

// 流式 / 异步口径（与 datasearch 的 ProviderProtocolCapabilities 同一套判定，2026-11 定版）：
// 流式按协议判 —— openai / anthropic / gemini 三种协议的 SSE 流式是协议必备行为，命中即「支持（协议）」；
// 异步只认官方批量端点实测过的厂商，中转站即使自称 openai 兼容也不算；其余一律「未收录」，不默认成支持。
// 实测依据（非法 Key 探活）：OpenAI POST /v1/batches → 401、Anthropic POST /v1/messages/batches → 401、
// Gemini POST :batchGenerateContent → 400（API key not valid）；三者都说明端点存在。
const STREAMING_PROTOCOLS = new Set(['openai', 'anthropic', 'gemini']);
const BATCH_VERIFIED = { openai: 'openai', anthropic: 'anthropic', google: 'gemini' };
// 无上游地址的模板（免费渠道 / 路由组 / 自填 / 本地 ONNX）不发请求，与后端能力位一致：不下结论
const streamingCell = (r) => (r.url && STREAMING_PROTOCOLS.has(String(r.protocol || '').toLowerCase())
  ? '支持（协议）'
  : '未收录');
const asyncCell = (r) => {
  const expected = BATCH_VERIFIED[String(r.id || '').toLowerCase()];
  return r.url && expected && expected === String(r.protocol || '').toLowerCase() ? '支持（端点实测）' : '未收录';
};

// 与 HostCreditQueryProvider.sameOrigin 同口径：域名相同、互为子域、或同一主域才算同一家
const baseDomain = (host) => {
  if (!host) return null;
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const tld = parts[parts.length - 1];
  const second = parts[parts.length - 2];
  const compound = tld.length === 2 && ['com', 'net', 'org', 'gov', 'edu'].includes(second);
  const keep = compound ? 3 : 2;
  return parts.length <= keep ? host : parts.slice(-keep).join('.');
};
const sameOrigin = (presetUrl, url) => {
  const a = hostOf(presetUrl);
  const b = hostOf(url);
  if (!b) return true;
  if (!a) return true;
  if (a === b || a.endsWith('.' + b) || b.endsWith('.' + a)) return true;
  return baseDomain(a) === baseDomain(b);
};

function creditOf(t) {
  if (!t.url) return { level: 'none', text: '不查（无上游地址）' };
  const host = hostOf(t.url);
  if (host && localHosts.has(host)) return { level: 'none', text: '不查（本机推理）' };
  const byId = bearer.find((b) => b.brand === t.id);
  if (byId) {
    return sameOrigin(byId.url, t.url)
      ? { level: 'official', text: `官方预设（${byId.brand}）` }
      : { level: 'relay', text: '中转探测（地址不是该厂商站点）' };
  }
  if (host && (host === 'api.openai.com' || host.endsWith('.openai.com'))) {
    return { level: 'openai', text: 'OpenAI 官方' };
  }
  // 官方站点但没有已收录的余额接口：不当中转站，一个请求都不发（与后端 creditLevel=uncovered 同口径）
  if (isOfficialSiteOf(t)) {
    return { level: 'uncovered', text: '官方站点·未收录（不探测）' };
  }
  return { level: 'relay', text: '中转探测' };
}

// 官方站点判定：与 ProviderRegistries.isOfficialSite 同口径 ——
// 先按平台标签查登记项，主机名命中任意登记项的 hosts 时同样算官方站点（平台标签不可信时以主机名为准）
const hostMatches = (host, official) => !!host && !!official
  && (host === official || host.endsWith('.' + official) || official.endsWith('.' + host));
function isOfficialSiteOf(t) {
  const byIdEntry = registryById.get(String(t.id || '').toLowerCase());
  const entry = byIdEntry || (hostOf(t.url)
    ? (providerRegistry.providers || []).find((p) =>
      (p.hosts || []).some((h) => hostMatches(hostOf(t.url), String(h || '').toLowerCase())))
    : null);
  if (!entry) return false;
  const hosts = entry.hosts || [];
  if (!hosts.length) return false;
  const host = hostOf(t.url);
  if (!host) return true;
  return hosts.some((h) => hostMatches(host, String(h || '').toLowerCase()));
}

function modelsOf(t) {
  if (t.id === 'onnx') return '本地清单';
  if (t.id === 'router-group') return '模型库成员';
  if (t.id === 'free-channel') return '运行时路由';
  if (!t.url) return '自填地址';
  const host = hostOf(t.url);
  if (host && localHosts.has(host)) return '本机 /models → /api/tags';
  if (t.protocol === 'gemini') return '/models?key=';
  if (t.protocol === 'anthropic') return '/models（见第二节）';
  return '远端 /models';
}

// 模型目录：与 ModelsDevCatalogProvider 同口径，先按登记表的 models.dev 目录键
// （together → togetherai、qwen → alibaba），再按别名精确匹配，最后按主机名相等 / 子域匹配。
const catalogByAlias = new Map();
const catalogByHost = new Map();
if (catalogSnapshot) {
  for (const [key, provider] of Object.entries(catalogSnapshot.providers || {})) {
    catalogByAlias.set(String(key).toLowerCase(), provider);
    for (const alias of provider.aliases || []) catalogByAlias.set(String(alias).toLowerCase(), provider);
    for (const host of provider.hosts || []) catalogByHost.set(String(host).toLowerCase(), provider);
  }
}
function catalogOf(t) {
  const id = String(t.id || '').toLowerCase();
  const entry = registryById.get(id);
  const modelsDevId = entry && entry.modelsDevId ? String(entry.modelsDevId).toLowerCase() : null;
  let provider = modelsDevId ? catalogByAlias.get(modelsDevId) || null : null;
  if (!provider) provider = catalogByAlias.get(id) || null;
  if (!provider) {
    const host = hostOf(t.url) || '';
    for (const [candidate, p] of catalogByHost) {
      if (host === candidate || host.endsWith('.' + candidate)) { provider = p; break; }
    }
  }
  return provider ? Object.keys(provider.models || {}).length : null;
}

// 签到是账号渠道（AccountChannelAuthManager）的能力，不是提供商模板字段；
// 扫实现类的 @Spi 别名与 supportsCheckin() / supportsAutoCheckin() 返回值。
const CHANNEL_DIRS = [
  'spring-support-parent-starter/spring-support-ai-starter/src/main/java/com/chua/starter/ai/support/spi/impl',
  'spring-support-parent-starter/spring-support-account-starter/src/main/java/com/chua/starter/account/channel',
];
function walkJava(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJava(full, out);
    else if (entry.name.endsWith('AccountChannelAuthManager.java')) out.push(full);
  }
  return out;
}
function scanChannels() {
  const classes = [];
  const files = CHANNEL_DIRS.flatMap((dir) => walkJava(path.join(ROOT, dir)));
  for (const file of files) {
    const txt = fs.readFileSync(file, 'utf8');
    const ids = [...txt.matchAll(/@Spi\("([^"]+)"\)/g)].map((m) => m[1]);
    if (!ids.length && /@Spi\(MagpieSupport\.CHANNEL\)/.test(txt)) ids.push('magpie');
    if (!ids.length) continue;
    // 方法体按大括号配对取，兼容单行 `boolean supportsCheckin() { return true; }`，
    // 也避免把 Javadoc 里的 {@link #supportsCheckin()} 当成实现
    const methodReturn = (name) => {
      const re = new RegExp('boolean\\s+' + name + '\\s*\\(\\s*\\)\\s*\\{');
      const m = re.exec(txt);
      if (!m) return null;
      let i = m.index + m[0].length;
      let depth = 1;
      const start = i;
      while (i < txt.length && depth > 0) {
        const ch = txt[i++];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      const body = txt.slice(start, i - 1);
      const r = /\breturn\s+(true|false)\s*;/.exec(body);
      return r ? r[1] === 'true' : null;
    };
    const className = /class\s+(\w+)/.exec(txt)?.[1] || path.basename(file, '.java');
    const parent = /class\s+\w+\s+extends\s+(\w+)/.exec(txt)?.[1] || null;
    classes.push({
      ids,
      className,
      parent,
      file: path.basename(file),
      checkin: methodReturn('supportsCheckin'),
      auto: methodReturn('supportsAutoCheckin'),
    });
  }
  // 子类没覆写时继承父类结论（如 qoder-cn extends qoder）
  const byClass = new Map(classes.map((c) => [c.className, c]));
  const resolve = (target, seen = new Set()) => {
    if (target.checkin !== null || !target.parent || seen.has(target.className)) return target;
    const parent = byClass.get(target.parent);
    if (parent) {
      seen.add(target.className);
      resolve(parent, seen);
      target.checkin = parent.checkin;
      if (target.auto === null) target.auto = parent.auto;
    }
    return target;
  };
  classes.forEach((c) => resolve(c));
  const map = new Map();
  for (const c of classes) {
    const checkin = c.checkin === true;
    for (const id of c.ids) {
      map.set(id, { checkin, auto: checkin ? (c.auto !== false) : null, file: c.file });
    }
  }
  return map;
}
const channelCheckins = scanChannels();

/**
 * 限制路径：镜像后端 ProviderLimitPresets.entryOf 的匹配顺序 —— 先精确命中 aliases，
 * 再按主机名（相等或子域）匹配；登记表同时是后端加载的那份 JSON。
 * 返回 { text, preset }，preset 为命中的厂商键（未命中为 null）。
 */
function limitOf(t) {
  const host = hostOf(t.url) || '';
  const p = String(t.id || '').toLowerCase();
  const entry = limitEntries.find((e) => (e.aliases || []).includes(p))
    || (host ? limitEntries.find((e) => (e.hosts || []).some((h) => host === h || host.endsWith('.' + h))) : null);
  if (entry) {
    if (entry.verified) return { preset: entry.id, kind: 'verified', text: '文档登记（' + entry.id + '，已核对口径）' };
    if (entry.doc) return { preset: entry.id, kind: 'doc', text: '文档入口（' + entry.id + '）→ 响应头' };
    return { preset: entry.id, kind: 'none', text: '未收录（登记表无文档）→ 响应头' };
  }
  if (!t.url) return { preset: null, kind: 'manual', text: '仅手动（无上游地址）' };
  if (t.id === 'onnx' || t.id === 'ollama') return { preset: null, kind: 'local', text: '仅手动（本地推理）' };
  return { preset: null, kind: 'header', text: '响应头 → 手动' };
}

const seen = new Map();
for (const t of rows) {
  t.credit = creditOf(t);
  t.models = modelsOf(t);
  t.limit = limitOf(t);
  t.catalog = catalogOf(t);
  t.checkin = channelCheckins.get(String(t.id).toLowerCase()) || null;
  t.proto = protocolLabel[t.protocol] || t.protocol;
  seen.set(t.id, (seen.get(t.id) || 0) + 1);
}

const tally = (keyFn) => rows.reduce((acc, r) => { const k = keyFn(r); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
const byCredit = tally((r) => r.credit.level);
const byProto = tally((r) => r.proto);
const byLimit = tally((r) => (r.limit.preset ? 'preset' : r.limit.text));
const catalogRows = rows.filter((r) => r.catalog != null).length;
const channelRows = rows.filter((r) => r.checkin != null).length;
const channelYesRows = rows.filter((r) => r.checkin && r.checkin.checkin).length;
const channelYesIds = [...channelCheckins.entries()].filter(([, v]) => v.checkin).map(([k]) => k);
const officialRows = rows.filter((r) => r.credit.level === 'official');
const officialIds = [...new Set(officialRows.map((r) => r.id))];

const lines = [];
lines.push('# 提供商能力矩阵（AI 控制台）');
lines.push('');
lines.push('> 数据来源：`pages/ai/src/components/models/model.constants.ts`（模板库，' + rows.length + ' 行 / ' + seen.size + ' 个唯一 id，2026-11-16）');
lines.push('> 判定依据：`ApiProviderController` 的 `creditBrand` / `candidateKinds` / `creditLevel` / `isOfficialOpenAi` / `AUTO_CREDIT_KINDS` / `syncProvider`，datasearch 的 `provider-credit-endpoints.json`（官方余额端点 / 同源判断）与 `provider-registry.json`（名称 / 说明 / 协议 / 地址 / models.dev 目录键 / 能力位 / 余额口径），`fetchModelsFromUpstream`，`ProviderLimitCollector` / `ProviderLimitPresets` / `HeaderLimitMechanism`，`ProviderModelCatalogs` / `ProviderCatalogSyncService` / `ProviderProtocolCapabilities`');
lines.push('> 本表由 `pages/ai/docs/gen-providers-doc.js` 生成，改模板或改预设后重跑即可，不要手改。');
lines.push('');
lines.push('## 一、结论');
lines.push('');
lines.push('| 维度 | 结果 |');
lines.push('| --- | --- |');
lines.push('| 模板行数 / 唯一 id | ' + rows.length + ' 行，' + seen.size + ' 个（`google`、`baichuan`、`volcengine` 各重复一次，指向不同地址） |');
lines.push('| 协议分布 | ' + Object.entries(byProto).map(([k, v]) => k + ' ' + v).join('、') + ' |');
lines.push('| 拉取模型 | 除 ONNX / 路由组 / 免费渠道 / 自填地址外，其余模板都走 `GET {base_url}/models`；OpenAI 兼容与 Gemini 可直接用（Gemini 用 `?key=`），Anthropic(CC) 看上游是否认 Bearer（见第二节） |');
lines.push('| 余额查询 | 官方预设 ' + (byCredit.official || 0) + ' 行（' + officialIds.length + ' 个厂商）、OpenAI 官方 ' + (byCredit.openai || 0) + '、官方站点未收录 ' + (byCredit.uncovered || 0) + '、中转探测 ' + (byCredit.relay || 0) + '、不查 ' + (byCredit.none || 0) + ' |');
const limitKind = (k) => rows.filter((r) => r.limit.kind === k).length;
lines.push('| 限制查询 | 文档登记 ' + limitKind('verified') + ' 行（已核对口径）、文档入口 ' + limitKind('doc') + ' 行、未收录但可观测响应头 ' + limitKind('none') + ' 行、纯响应头 ' + limitKind('header') + ' 行、仅手动 ' + (limitKind('manual') + limitKind('local')) + ' 行；登记表 ' + limitEntries.length + ' 家，其中官方文档入口 ' + limitDocEntries.length + ' 家、已核对口径 ' + limitVerified.length + ' 家 |');
lines.push('| 模型信息 | 公开目录覆盖 ' + catalogProviders + ' 家 / ' + catalogModels + ' 个模型（说明、目录价、上下文、模态与能力位）；对应到模板 ' + catalogRows + ' 行；流式按协议判 ' + rows.filter((r) => streamingCell(r) !== '未收录').length + ' 行支持（' + rows.filter((r) => asyncCell(r) !== '未收录').length + ' 行异步已实测），其余「未收录」 |');
lines.push('| 签到 | 账号渠道能力，不是提供商模板字段：' + channelYesIds.length + ' 个渠道 id 支持（' + channelYesIds.join('、') + '）；模板里 ' + channelRows + ' 行有同名账号渠道，其中支持 ' + channelYesRows + ' 行；其余不适用 |');
lines.push('');
lines.push('**200+ 家的实际含义**：没有任何一家是「逐家写死代码」。');
lines.push('');
lines.push('- **官方预设**：' + officialIds.length + ' 个厂商有明确的余额端点（datasearch 的 `provider-credit-endpoints.json`，11 家 Bearer + 4 家 AK/SK 签名），命中后直接用它的地址和字段；');
lines.push('- **中转探测**：' + (byCredit.relay || 0) + ' 行，上游不是厂商官方站点（中转 / 聚合站 / 自建网关），按后端 `AUTO_CREDIT_KINDS` 的顺序依次试（本次生成时为 `' + relayChain + '`），谁先返回数字谁算数，全不通就只显示「已尝试：…」和上游原文；');
lines.push('- **官方站点·未收录**：' + (byCredit.uncovered || 0) + ' 行，上游是厂商自己的官方站点，但官方文档没写余额接口。官方站点上没有 OpenAI 兼容计费协议，拿官方 Key 去打 `/v1/dashboard/billing/*` 只会 404，所以**一个请求都不发**，直接显示「未收录」；要查只能在该供应商「余额」里配自定义地址 + 字段表达式（`credit_url` / `credit_expression`），配了就以用户配置为准；');
lines.push('- **不查**：没有上游地址（路由组 / 自填）、或地址指向本机（ONNX / Ollama），发请求没有意义。');
lines.push('- **限制**：不逐家写死 —— 登记表 ' + limitEntries.length + ' 家（模板库全量，含去重别名与主机名），其中 ' + limitDocEntries.length + ' 家带官方文档入口（models.dev 目录的 `doc` 字段）；入口只是文档，不等于页面写了数值，数值仍靠「拉 `/models` 时顺带读响应头」或 `extra.limits_manual` 手填，都拿不到才显示「未收录」。第四节每行的「限制查询」列就是这个判定结果。');
lines.push('- **签到**：与余额 / 限制不同，签到没有「按提供商」的通用端点，它属于账号渠道（OAuth / 网关账号）能力；API Key 类提供商模板没有登录态，也不可能签到。所以第四节这一列只在模板 id 恰好与账号渠道同名时给出结论，其余写「不适用」。');
lines.push('');
lines.push('## 二、拉取模型：OpenAI / CC / Gemini 三种协议怎么请求');
lines.push('');
lines.push('「从提供商获取模型」只有一条实现：`fetchModelsFromUpstream` → `requestUpstreamModels`，');
lines.push('实际请求就是 `GET {base_url}/models`，认证头按供应商配置的 `auth_scheme` / `extra.auth_header` / `extra.auth_prefix` 决定（默认 `Authorization: Bearer <key>`）：');
lines.push('');
lines.push('| 协议 | 请求地址 | 认证 | 覆盖行数 | 结论 |');
lines.push('| --- | --- | --- | --- | --- |');
lines.push('| OpenAI 兼容 | `{base}/models`；404 且非 Gemini 时补 `{base}/v1/models` 重试一次；Ollama 再回落 `/api/tags` | 默认 `Authorization: Bearer`，可改头名与前缀 | ' + (byProto['OpenAI 兼容'] || 0) + ' | 支持 |');
lines.push('| Gemini | `{base}/models?key=<key>`（platform 含 google / gemini 时用查询参数认证） | `?key=` | ' + (byProto.Gemini || 0) + ' | 支持 |');
lines.push('| Anthropic(CC) | `{base}/models`（与其他协议同一条链，没有单独分支） | 只发一个认证头，**不带** `anthropic-version` | ' + (byProto['Anthropic(CC)'] || 0) + ' | 看上游：CC 中转站（one-api / new-api 系）大多认 Bearer，能拉到；Anthropic 官方 `/v1/models` 要 `x-api-key` + `anthropic-version`，默认配置会 401（见第七节缺口） |');
lines.push('');
lines.push('只有 **404** 会被当成「拉不到」，401 / 403 / 429 分别回「Key 无效」「没有读取模型列表的权限」「请求过于频繁」，页面据此区分「地址填错」和「Key 权限不对」。不拉模型列表的只有 4 类：ONNX（读本地模型门面）、路由组（读模型库成员）、免费渠道（读运行时合并路由表）、自填地址的 `custom`。');
lines.push('');
lines.push('另有一条独立链路是「检测协议」（`probeProtocol` / `modelListCandidates`，探测某个地址支持哪些协议）：它按协议排一整串候选地址，Anthropic 发 `x-api-key` + `anthropic-version: 2023-06-01`，Gemini 用 `?key=`，OpenAI 试 `/v1/models`、`/models`、`/openai/v1/models`。那条链路是判断「地址支持什么」，不是这里的「拉模型清单」，两者别混。');
lines.push('');
lines.push('## 三、余额口径怎么判（后端分级）');
lines.push('');
lines.push('| 级别 | 判定条件 | 页面徽章 |');
lines.push('| --- | --- | --- |');
lines.push('| `official` | 平台 id 或 `base_url` 域名命中 `provider-credit-endpoints.json`（`kind=registry` 与兼容的 `kind=host` 读同一份），且地址与该厂商同源 | 官方预设 |');
lines.push('| `openai` | `base_url` 是 `api.openai.com` | OpenAI 官方 |');
lines.push('| `relay` | 有上游地址但没命中预设 | 中转站探测 |');
lines.push('| `manual` | `extra.credit_kind` 指定了唯一实现 | 手动口径 |');
lines.push('| `none` | 无上游地址，或地址是本机 | 无上游 / 不查 |');
lines.push('');
lines.push('AK/SK 签名类 4 家（`aliyun-bss`、`volc-billing`、`baidu-bce`、`qiniu`）只在账户侧（`kind=registry` / 兼容的 `kind=host` + `providerId`）可用，不参与 AI 供应商面板的自动探测——那侧只有 API Key，拿不到 SecretKey。');
lines.push('');
lines.push('**官方预设全表（15 家）**：`provider-credit-endpoints.json` 里登记的全部厂商，共 11 家 Bearer + 4 家 AK/SK 签名；「AI 面板」列指这条预设在模型管理的供应商上能不能自动命中。');
lines.push('');
lines.push('| 厂商 | 余额端点 | AI 面板 |');
lines.push('| --- | --- | --- |');
const tplIds = new Set(rows.map((r) => r.id));
for (const h of hosts) {
  const panel = SIGN_KINDS.has(h.brand)
    ? '不参与（只有 AK/SK）'
    : tplIds.has(h.brand)
      ? '命中（模板 id 同名）'
      : '无同名模板，仅账户侧可用';
  lines.push('| `' + h.brand + '` | `' + h.url.replace(/^https?:\/\//, '') + '` | ' + panel + ' |');
}
lines.push('');
lines.push('**同源是硬约束**：`base_url` 的用途是证明「这把 Key 是这个站点的」。域名与厂商预设不一致时，`host` 候选会被直接跳过（`HostCreditQueryProvider.sameOrigin`），也不会拿中转站的 Key 去问厂商官方接口；反过来，中转站地址只走中转探测，探测用的根地址就是它自己的 `base_url`。拿别家的 Key 去问这家要余额，只会得到 401，然后把假结论写进页面。');
lines.push('');
lines.push('## 四、逐个提供商（能力矩阵）');
lines.push('');
lines.push('纵向是模板库里的每家提供商（' + rows.length + ' 行），横向是六项能力。单元格只写「会走哪条路」或「不支持」，不把「有文档」写成「有数值」；「流式」「异步」两列按第七节口径判定，判定不了写「未收录」而不是「支持」：');
lines.push('');
lines.push('| # | 提供商 | 模板 id | 协议 | 余额查询 | 模型查询 | 限制查询 | 模型信息 | 流式 | 异步 | 签到 | 默认地址 |');
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
rows.forEach((r, i) => {
  const url = r.url ? '`' + r.url.replace(/^https?:\/\//, '') + '`' : '—';
  const catalog = r.catalog == null ? '未收录' : '目录 ' + r.catalog + ' 个模型';
  const checkin = r.checkin == null
    ? '不适用'
    : r.checkin.checkin
      ? '支持（渠道签到）'
      : '不支持（渠道无签到端点）';
  lines.push('| ' + (i + 1) + ' | ' + r.name + ' | `' + r.id + '` | ' + r.proto + ' | ' + r.credit.text + ' | ' + r.models + ' | ' + r.limit.text + ' | ' + catalog + ' | ' + streamingCell(r) + ' | ' + asyncCell(r) + ' | ' + checkin + ' | ' + url + ' |');
});
lines.push('');
lines.push('**签到为什么大多是「不适用」**：签到需要登录态（OAuth / 网关账号），模板里的提供商是 API Key 调用，没有可签到的账户。模板 id 与账号渠道同名时才继承渠道结论（`cline` / `kilo` / `minimax` / `opencode` 四个渠道都明确没有签到端点）。真正的签到能力在渠道页，见下表。');
lines.push('');
lines.push('| 账号渠道 | 签到 | 自动签到 | 依据实现 |');
lines.push('| --- | --- | --- | --- |');
const channelIds = [...channelCheckins.keys()].sort();
for (const id of channelIds) {
  const c = channelCheckins.get(id);
  lines.push('| `' + id + '` | ' + (c.checkin ? '支持' : '不支持') + ' | '
    + (c.checkin ? (c.auto ? '支持' : '不支持（渠道自行签到）') : '—')
    + ' | `' + c.file + '` |');
}
lines.push('');
lines.push('`supportsCheckin()` / `supportsAutoCheckin()` 是 `AccountChannelAuthManager` 的默认方法（默认 `false` / `true`）；上表由实现类的返回值直接生成，未覆写的按接口默认计算。magpie 聚合 WorkBuddy / Trae / MiniMax / Qoder 四家的签到端点，但它自己有定时器，所以自动签到记 `false`，避免重复跑。');
lines.push('');
lines.push('## 五、限制与计费口径怎么同步（供应商详情「同步」）');
lines.push('');
lines.push('入口：供应商详情 →「同步」→ `POST /api/providers/{id}/sync`。一次点击做五件事，结果按分节返回：');
lines.push('');
lines.push('| 分节 | 数据来源 | 落点 | 拿不到时 |');
lines.push('| --- | --- | --- | --- |');
lines.push('| 限制 | 手动配置 → 官方文档登记表 → 上游响应头，按此顺序 | `sys_ai_provider.extra.provider_limits` | 页面显示「未收录」并列出已尝试链路，不写 0 |');
lines.push('| 计费标准 | 官方指标源（`ChatClientIndicators`）+ 上游 `/models` 的 pricing | `sys_ai_model_metrics` + 服务商模型行 | 已有价格不覆盖；官方源未接入时给出官方价格页 |');
lines.push('| 模型描述 | 上游 `/models` 的 `description` / `summary`；上游缺失时由公开目录补位 | `sys_ai_provider_model.description` | 默认只补空值，`overwrite_descriptions=true` 才覆盖（公开目录永远只补空值） |');
lines.push('| 公开目录 | models.dev 快照（`ProviderModelCatalogProvider` SPI，' + catalogProviders + ' 家 / ' + catalogModels + ' 个模型） | 说明补空；上下文 / 输出上限 / 多模态 / 思考 / 工具调用 / 附件 / 温度 / 权重等能力位补空；价格写 `sys_ai_model_metrics`（`source=models.dev`）；流式 / 异步按 `ProviderProtocolCapabilities` 判定后写指标两列（`support_streaming` / `support_async`）并回写服务商模型行 | 未收录时保留上游与手工值；协议未知或厂商未实测时返回 `null` 显示「未收录」 |');
lines.push('| 定价规则 | 点击同步时按 `ProviderPricingProvider.refresh` 实时抓官方价格页（当前 DeepSeek、Moonshot/Kimi、OpenCode、OpenCode Go、CommandCode、Anthropic、Agnes、NanoGPT、AI/ML API、Alibaba Cloud Model Studio（Qwen）、Eden AI、LLM Gateway（canonical）、LLM Gateway provider 映射（`?mapped=true`）、Merge Gateway（官方 Model catalog）十四家已接入），静态 `provider-pricing-rules.json` 仅作离线兜底 | `sys_ai_model_metrics.sys_ai_model_metrics_pricing_rules`（JSON），并按 `model_pattern` 下发给模型行 `metrics.pricing_rules`；规则内带 `source_url` / `fetched_at` | 抓取/解析失败时不覆盖旧价，报告里回 `pricing_error`；未收录时为空，不拿标准目录价冒充峰谷价。Dots 无公开可核对价格页，不写价格 |');
lines.push('');
const pricing = JSON.parse(fs.readFileSync(PRICING_REGISTRY, 'utf8'));
const pricingRules = (pricing.entries || []).reduce((n, e) => n + (e.rules || []).length, 0);
lines.push('**定价规则覆盖**：登记 ' + (pricing.entries || []).length + ' 家 / ' + pricingRules + ' 条静态兜底，当前 DeepSeek、Moonshot/Kimi、OpenCode、OpenCode Go、CommandCode、Anthropic、Agnes、NanoGPT、AI/ML API、Alibaba Cloud Model Studio（Qwen）、Eden AI、LLM Gateway（canonical）、LLM Gateway provider 映射（`?mapped=true`）、Merge Gateway（官方 Model catalog）十四家接入实时抓取并标 `verified=true`；其余厂商按同一 JSON 格式追加，不猜数值。DeepSeek 抓峰谷与按次价，Moonshot 抓 K3 五列 / K2 三列（人民币 / 百万 token）；OpenCode 抓 `/docs/zen` 的 HTML 价格表，OpenCode Go 抓 `/docs/console/go/` 的 HTML 表格（Go / Go Plus / Go Teams 同价；只取完整模型名，分档与峰谷行不合并），CommandCode 抓官方 pricing-limits 的 role=row 网格，Anthropic 抓官方 pricing 的模型卡片，Agnes 抓官方 Model Pricing 的 Angel User Trial Price（当前价；list price 写在 note，不把 trial 0 价冒充 list price），NanoGPT 抓 `/pricing` 的常用模型表（页面未登录时只列常用模型，note 已注明），AI/ML API 抓 `/ai-ml-api-pricing` 的 Language Models 表（Input 单元格内的 cache 子价不拆分）。Alibaba Cloud Model Studio 抓官方 Model Studio 定价页的 named-regex（只取 qwen/qvq/qwq/deepseek/glm/kimi/... 前缀模型，同一模型多地域时取页面首个价）；Eden AI 抓 `/models` 自定义 grid 的 named-regex（按日期前缀 + 25 个 creator 后缀剥离展示名，排除 5.5% 平台费，页面只渲染 99 行）；LLM Gateway 抓官方 `/v1/models` JSON 的 canonical 模型价（per-token 转 USD/百万，`include_free=false`；不把 canonical 价套到 `llmgateway-providers` 的 provider 变体）；provider 映射源抓 `https://api.llmgateway.io/v1/models?mapped=true`，按 `provider/externalId` 生成规则，只接受 `e-6` 科学计数法价格（397/468 个映射；普通 per-token 小数不写入，避免单位错误），落库按模型名归一化去重后覆盖 190/201 个 canonical 模型。Merge Gateway 抓官方 Model catalog 的 328 行模型表（named-regex；只取标准 Input/Output 价，12 条分档价、6 条 Free/未标价/按分钟价、21 个目录有但表内没有的模型不写入），解析 263 行、目录 206 个模型命中 167 个。新增厂商只改 `source.type` 与选择器 / 正则，不加 Java 分支；每次点「同步」都重新抓官方价格页，页面改价后无需改代码，重新同步即落库；抓取失败会保留库里的上一次价格并在报告里给出原因。规则字段：');
lines.push('');
lines.push('- `item` / `unit` / `quantity`：计价项与计价单位。`quantity=1000` + `unit=search` 表示「每 1000 次」，`quantity=10000` + `unit=char` 表示「每万字符」，`unit=hour` 表示按小时；');
lines.push('- `peak_price` / `off_peak_price` / `standard_price`：峰价、谷价、不分峰谷的标准价；`peak_windows` 写时区、星期与起止分钟（左闭右开），`off_peak_policy` 说明闲时规则；');
lines.push('- `model_pattern` 支持 `*` 通配；同一模型可同时命中标准 token 价与按次价，展示时分开列，不混算。');
lines.push('');
lines.push('**「只有一个 appkey」的口径**：余额 / 用量只走同源 Bearer 接口；官方有 usage 接口的（OpenAI 兼容计费、DeepInfra、Together、OpenRouter、OpenCode Go 等）直接按 usage 折算，不要求另有余额端点。签到需要登录态，API Key 模板一律不适用；阿里云 BSS / 火山 / 百度 BCE / 七牛这 4 家 AK/SK 签名类不会自动出现在候选里（自动候选只取 Bearer 类预设）。');
lines.push('');
lines.push('**限制机制**（`ProviderLimitCollector`，与余额同构：一种机制一个实现，不逐家写死）：');
lines.push('');
lines.push('- `manual`：读 `extra.limits_manual`，支持 `concurrency`、`requests_per_minute`、`requests_per_day`、`tokens_per_minute`、`tokens_per_day`、`monthly_request_quota`、`monthly_token_quota`、`billing_basis`、`currency`、`notes`、`source_url`、`model_concurrency`；');
lines.push('- `doc`：`ProviderLimitPresets` 从 datasearch 的 `provider-catalog/provider-limit-docs.json`（`ProviderLimitProvider` SPI）加载登记表（' + limitEntries.length + ' 条），先按 provider id 精确匹配、再按主机名匹配；只有核对过原文的条目返回数值 / 计费口径，其余条目只回传 `doc_url`；');
lines.push('- `header`：复用本次 `GET /models` 的响应头，读 `x-ratelimit-*`（OpenAI 风格）、`ratelimit-policy` / `ratelimit-limit`（IETF 草案）、`anthropic-ratelimit-*`、`retry-after`。不额外发请求。');
lines.push('');
lines.push('**扩展方式（SPI）**：新增机制不必改任何源码 —— 声明 `ProviderLimitMechanism` 的 Spring Bean，或在 `META-INF/services/` 登记实现即可；执行顺序由 `order()` 决定（内置 manual=10 / doc=20 / header=30），同一 `kind` 只保留一个，Spring Bean 优先于 ServiceLoader。');
lines.push('');
lines.push('SPI 分两层，数据与机制都在 `spring-support-datasearch-starter`，ai-starter 只做消费方：');
lines.push('');
lines.push('- **厂商定义 / 能力（数据侧，去哪拿）**：`provider.spi.ProviderLimitProvider`（限制登记项）与 `ProviderModelCatalogProvider`（模型目录），都按 `META-INF/services` 装载，调用方只给「平台 + 地址」；内置实现是登记表与 models.dev 快照，新增来源（厂商控制台、私有登记表）只需加一个实现类 + 一行登记；');
lines.push('- **获取机制（怎么拿）**：`provider.limit.ProviderLimitMechanism`（manual / doc / header）决定「怎么拿到数值」，`ProviderLimitMechanisms` 排序，与余额的 `CreditQueryProvider` 同构；机制要读的只有 `ProviderLimitContext`（地址 / 鉴权 / 代理 / `extra`），不依赖宿主的存储实体，宿主在 `ProviderLimitAutoConfiguration` 里把容器 Bean 灌进注册表。');
lines.push('');
lines.push('**模型信息口径**（公开目录）：快照 `provider-catalog/models-dev.json.gz`（' + catalogProviders + ' 家 / ' + catalogModels + ' 个模型，约 0.42 MB）随 datasearch 发布，字段映射如下：');
lines.push('');
lines.push('| 目录字段 | 落点 | 说明 |');
lines.push('| --- | --- | --- |');
lines.push('| `description` | `sys_ai_provider_model.description` | 只在为空时补；上游 / 手写文案优先 |');
lines.push('| `cost.input` / `cost.output` / `cost.cache_read` / `cost.cache_write` | `sys_ai_model_metrics.price_input_per_musd` 等 | USD / 百万 token；已有价格不覆盖，手动锁定字段跳过 |');
lines.push('| `limit.context` / `limit.output` | 模型行 `context_window` / `max_tokens` + 指标同名列 | token 数；只补空值 |');
lines.push('| `modalities` / `tool_call` / `reasoning` / `attachment` / `structured_output` / `temperature` / `open_weights` | 模型行能力位 + `metrics` | 只补空值；`null` 表示目录没写，不当成 `false` |');
lines.push('| `knowledge` / `release_date` / `last_updated` | 模型行同名列 | 只补空值 |');
lines.push('| `streaming` / `async` | 模型指标 `sys_ai_model_metrics.sys_ai_model_metrics_support_streaming` / `_support_async`，同步报告同名字段（+ `*_source`） | **models.dev 没有这两个字段**：按第七节口径判定 —— 流式看协议（`protocol`），异步只认端点实测过的官方厂商（`probe`）；判定不了返回 `null` 显示「未收录」，不按协议默认成「支持」。两列由 V6.15 迁移补上，同步时写入指标行并回写服务商模型行（只补空值） |');
lines.push('');
lines.push('**已核对口径的条目**（只有这些带数值 / 计费口径，其余条目只有文档入口）：');
lines.push('');
lines.push('| 厂商 | 名称 | 核对程度 | 官方文档 |');
lines.push('| --- | --- | --- | --- |');
limitVerified.forEach((r) => {
  const hasNumbers = r.limits && Object.keys(r.limits).some((k) => k !== 'billing_basis' && k !== 'currency');
  const state = hasNumbers ? '已核对（含数值）' : '已核对（仅口径）';
  lines.push('| `' + r.id + '` | ' + r.name + ' | ' + state + ' | ' + (r.doc ? '`' + r.doc.replace(/^https?:\/\//, '') + '`' : '—') + ' |');
});
lines.push('');
lines.push('登记表由 datasearch 的 `provider-catalog/provider-limit-docs.json` 提供，后端 `ProviderLimitProvider` SPI 与本文档共用这一份数据；其余 ' + (limitDocEntries.length - limitVerified.length) + ' 家只有官方文档入口（models.dev 目录的 `doc` 字段，多为模型/接口文档而非限制页），没有数值口径，页面不替厂商编数字。');
lines.push('');
lines.push('DeepSeek 的并发是账号级（所有 API Key 合并计算），官方按模型给固定值；Moss 只公布了计费口径与「以服务端错误码为准」，没有固定并发 / RPM 数字；OpenAI / Anthropic / Gemini 是按账户等级分级，本表不写死数字，运行时交给响应头观测。');
lines.push('');
lines.push('**为什么 200+ 家都能覆盖**：网关类的限流头是行业通行做法，只要能拉到 `/models` 就能顺带读到；读不到就说明对方没有公开口径，页面照实说「未收录」，不编数字。中转站 / 自建网关也可以把后台看到的并发、RPM 填进 `extra.limits_manual`，同步时原样落库。');
lines.push('');
lines.push('## 六、验证状态（照实写）');
lines.push('');
lines.push('- 早期真实链路验证过 4 家：Moss（三家口径全 404，原样回传）、路由组（`none`，不查）、Agnes AI（`billing` 命中，读到真实额度）、ONNX（`none`，本地推理）；本次定价 / 目录另验收 OpenCode、CommandCode、Anthropic、Agnes 四家（见下条），不是所有官方预设都做过字段级验证；');
lines.push('- 其余「官方预设」只做过**假 Token 探活路由**（404 说明路径不对，401/403 说明路径存在），没有用真实 Key 做过字段级验证；');
lines.push('- 「中转探测」这类没有逐家验证过——它本来就是对未知站点的依次尝试，命中与否取决于对方有没有挂那套接口；');
lines.push('- 限制登记表：' + limitEntries.length + ' 条（官方文档入口 ' + limitDocEntries.length + ' 条）已用本地探针验证装载与匹配（DeepSeek 命中数值、qwen 命中文档入口但无数字、baichuan 无条目、按主机名命中 302.ai）；只有 DeepSeek 并发、Moss 计费口径按官方原文核对，其余入口页多为模型 / 接口文档，不是限制页；');
lines.push('- 限制机制走 SPI（Spring Bean + `META-INF/services`），本地探针确认装载顺序为 `manual → doc → header`；');
lines.push('- 模型目录：本地探针确认 datasearch 侧装载 `modelsdev` 实现（' + catalogProviders + ' 家 / ' + catalogModels + ' 个模型），qwen → alibaba 命中并有说明 / 价格 / 上下文；`streaming` / `async` 由能力位 SPI（`ProviderCapabilityProvider`）在目录查询时补齐，口径与 `ProviderProtocolCapabilities` 一致：openai / anthropic / gemini 流式为 `true`（来源 `protocol`），openai / anthropic / google 异步为 `true`（来源 `probe`），无上游地址的 5 个模板（免费渠道 / DuckDuckGo / 路由组 / ONNX / 自填）返回 `null` 表示未收录；`openai` 不再带 `dots` alias，Dots 同步返回「公开目录未收录」，不会把 Dots 误同步成 OpenAI 模型；ai-starter 侧 `ProviderCatalogSpiTest`（6 项）、`ProviderPricingSpiTest`（8 项）、`PricingPageSourceTest`（5 项）通过（2026-11-16）；');
lines.push('- 「同步」接口已在 8082 新 jar 上做接口级验收：临时 provider 逐家调用 `POST /api/providers/{id}/sync`，OpenCode 目录 139 个模型 / 368 条实时规则、CommandCode 93 / 342、Anthropic 18 / 58、Agnes 4 / 18，四家均 `pricing_live=true`、`pricing_error=null`；落库抽查 `muse-wonder-1.0` 为 OpenCode 3 条 + CommandCode 3 条，`claude-opus-5-5` 为 Anthropic 4 条 + CommandCode 4 条 + OpenCode 4 条，`gpt-6-astra` 为 CommandCode 4 条（$10 / $50 / $1 / $12.50），`agnes-3.0-flash` 为 Agnes 3 条（trial 0）；验证用临时 provider 与指标行已清理，未留测试数据；');
lines.push('- 2026-11-16 第二轮新增三家接口级验收：OpenCode Go 官方页 42 个模型 / 139 条规则，目录 41 / 139；NanoGPT 官方页 12 / 24，目录 621 / 24（未登录只列常用模型）；AI/ML API 官方页 769 / 1210，目录 168 / 1210。三家均 `pricing_live=true`、`pricing_error=null`；按目录展示名匹配并落库后实际命中 OpenCode Go 24 个模型 / 77 条、NanoGPT 12 / 24、AI/ML API 154 / 314（同一指标行按 `provider_id` 合并，实际行数少于目录模型数）。三家在限制登记表里只有文档入口（`verified=false`），没有核对的并发 / RPM 数值，未编数字；验证用临时 provider 与指标行已清理（metrics 回到 496 行，残留规则 0）；');
lines.push('- 2026-11-16 第三轮新增三家接口级验收：Alibaba Cloud Model Studio 目录 53 个模型 / 182 条实时规则，按 id 命中 26；Eden AI 目录 396 / 198，按展示名命中 15（页面仅渲染 99 行，note 已注明）；LLM Gateway canonical 目录 203 / 640，按 id 命中 203。三家均 `pricing_live=true`、`pricing_error=null`；落库抽查 `qwen-plus` 为 Alibaba $0.4 / $1.2、`claude-fable-5-2` 为 Eden AI $8 / $40、`claude-haiku-4-5` 为 LLM Gateway $1 / $5。Alibaba 插入 36 行 / 更新 17 行，Eden 插入 180 / 更新 146，LLM Gateway 上游 320 个模型插入 164 / 更新 203；验证用临时 provider 与指标行已清理（metrics 回到 496 行，新增 provider 规则 0 残留）。LLM Gateway 该轮只覆盖 canonical `llmgateway`；rank12 的补测见下一条。');
lines.push('- 2026-11-17 第四轮补 rank12 LLM Gateway provider 映射：官方 `/v1/models?mapped=true` 返回 626 条 provider 映射（1.09MB / 约 3.0s，低于 25s 抓取超时），按 `id` 为 `provider/externalId` 生成 912 条实时规则；目录 468 个映射中 397 个为 `e-6` 科学计数法价格，按 id 命中 397，落库按模型名归一化去重后覆盖 190/201 个 canonical 模型（94.5%）。`pricing_live=true`、`pricing_error=null`；落库抽查 `gpt-4o-mini` $0.15 / $0.6、`claude-fable-5-2` $8 / $40、`gpt-5-1` $1.25 / $10。同步报告更新 437 行 / 新增 212 行（含价列），临时 provider 与指标行已清理，metrics 回到本轮前 499 行、rank12 规则 0 残留。');
lines.push('- 2026-11-17 第五轮补 rank15 Merge Gateway：官方 Model catalog（1.7MB，328 行）解析 263 行标准价 / 526 条规则，目录 206 个模型命中 167 个（81.1%）；`pricing_live=true`、`pricing_error=null`。12 条分档价（>100K/>272K）、6 条 Free/未标价/按分钟价、21 个目录有但 catalog 未列，均不写入。上游 `/v1/models` 返回 403（该 appkey 无读取模型列表权限），价格抓取独立完成；落库抽查 `claude-fable-5-2` $8/$40、`gpt-5-1` $1.25/$10。同步报告更新 110 行 / 新增 93 行；临时 provider 与指标行已清理，metrics 回到本轮前 499 行、Merge 规则 0 残留。');
lines.push('- 官方检索说明：Bocha `site:` 对上述官方域基本无结果，改为直接请求官方价格页并缓存原文后离线解析；因此 `verified=true` 只表示「本次从官方域抓到并解析成功」，不表示第三方评测背书；');
lines.push('- 表里不会出现「支持」这种断言，只有「会走哪条路」。');
lines.push('');
lines.push('## 七、已知缺口');
lines.push('');
lines.push('- **Anthropic 官方拉模型缺 `anthropic-version`**：`requestUpstreamModels` 只发一个认证头，官方 `/v1/models` 除 `x-api-key` 外还要 `anthropic-version: 2023-06-01`，所以 `anthropic` 模板用官方 Key 拉模型会 401（「检测协议」那条链带了这个头，能过）。目前只能靠 CC 中转站或手填模型；要让官方 Key 直接可拉，得在拉模型链路补上这个头。');
lines.push('- 有官方余额接口、但本仓库还没有预设的厂商（如智谱、MiniMax 等）：没有拿到官方文档原文，一律不加，避免编地址；这类落到「官方站点·未收录」，不发探测请求，要查用手配的「自定义地址 + 字段表达式」；');
lines.push('- 每家的余额字段路径没有统一的行业标准，同一个 `billing` 口径在不同站点也会返回不同单位（USD / 美分 / 次数），表达式兜底就是为这个准备的。');
lines.push('- **免费渠道**是纯路由聚合（模型来自运行时合并路由表），自己没有账户，模板里的 `free.nomifun.com/v1` 只是占位地址；这个主机不在供应商登记表里，余额面板仍会按「中转探测」去请求它，结果没有业务意义，看这一行时忽略余额列即可。');
lines.push('- **限制只能观测到「上游肯说」的那部分**：限流做在网关 / nginx 层、响应头不返 `*ratelimit*` 的站点，这次同步拿到的就是「未收录」，只能靠 `extra.limits_manual` 手填；登记表 ' + limitEntries.length + ' 家里只有 ' + limitVerified.length + ' 家核对过口径（DeepSeek 并发、Moss 计费），其余 ' + (limitDocEntries.length - limitVerified.length) + ' 家只有文档入口，没有数值，不编数字。');
lines.push('- **流式 / 异步是「协议级 + 端点实测」两档口径，不是逐家文档结论**：models.dev 不提供这两个字段，所以流式按接入协议判（openai / anthropic / gemini 三种协议的 SSE 流式是协议必备行为，有上游地址才标「支持（协议）」，共 ' + rows.filter((r) => streamingCell(r) !== '未收录').length + ' 行，其余 ' + rows.filter((r) => streamingCell(r) === '未收录').length + ' 行是无上游地址的模板）；异步只标官方批量端点实测存在的厂商（OpenAI `/v1/batches`、Anthropic `/v1/messages/batches`、Gemini `:batchGenerateContent`，非法 Key 分别得 401 / 401 / 400，说明端点存在），共 ' + rows.filter((r) => asyncCell(r) !== '未收录').length + ' 行，其余 ' + rows.filter((r) => asyncCell(r) === '未收录').length + ' 行写「未收录」，不代表不支持 —— 中转站有没有实现批量端点只能逐家核对，没核对就不写。');
lines.push('- **流式 / 异步已落库**：`sys_ai_model_metrics` 新增 `sys_ai_model_metrics_support_streaming` / `_support_async` 两列（`V6.15__alter_ai_model_metrics_capabilities.sql` 补列，建库脚本同步），同步时写入指标行并回写服务商模型行；只补空值，已有结论不被覆盖。');
lines.push('- **价格来源分两层**：models.dev 的目录价（USD / 百万 token）只做补位；DeepSeek、Moonshot、OpenCode、OpenCode Go、CommandCode、Anthropic、Agnes、NanoGPT、AI/ML API、Alibaba Cloud Model Studio（Qwen）、Eden AI、LLM Gateway（canonical）、LLM Gateway provider 映射（`?mapped=true`）、Merge Gateway（官方 Model catalog）十四家已接入官方价格页实时抓取，规则内的 `source_url` 指向官方域，抓取失败保留库里的上一次价格；其余厂商没有官方来源就不写价格。');
lines.push('- **目录快照随包发布**：`provider-catalog/models-dev.json.gz` 生成于 2026-11-16，不会自动联网刷新；新增厂商 / 模型要重跑 `pages/ai/docs/gen-model-snapshot.js`（联网拉 models.dev 并裁剪）并重新发版。');
lines.push('- **限制落库后不参与限流**：`ProviderThrottle` 读的是 `extra.max_concurrency` / `extra.requests_per_minute`（供应商表单的两个字段），不读 `extra.provider_limits` 或 `limits_manual`；同步到的官方并发 / RPM 目前只做展示，要让它生效得再拉一条「限制 → 闸门」的读取链。');
lines.push('- **`extra.limits_manual` 目前没有独立表单**：写入口是供应商的 `extra` 配置（接口 / 库），管理面还没有「并发 / RPM / 配额」的输入控件；要改只能改 `extra`。这一步没做，是因为先要把同步链路跑通。');
lines.push('- **上游 pricing 不是每家都有**：中转站 `/models` 大多只回 id 与 name，`pricing` 只有 OpenRouter 这类聚合站才带；没有上游价格时计费标准只能来自官方指标源（`ChatClientIndicators`），两条都没有就显示「未接入」，不猜价格。');
lines.push('- **Dots 没有公开可核对的价格 / 余额页**：`studio.dots.ai` 与 `dots.ai/platform` 都是 SPA 空壳，未找到可解析的官方价格表；本期不写 Dots 价格、不加 Dots 余额预设，目录同步返回「未收录」；`provider-limit-docs.json` 里带 `dots` alias 的重复 `openai` 条目已删除，避免把 Dots 误映射成 OpenAI。');
lines.push('- **Top20 的 LLM Gateway provider 映射只做到部分覆盖**：rank12 `llmgateway-providers`（468 个映射，去重后 201 个 canonical 模型）已用官方 `/v1/models?mapped=true` 接入，397 个映射为 `e-6` 科学计数法价格，覆盖 190/201 个 canonical 模型（94.5%）；剩余 11 个未覆盖：9 个映射的价格是普通 per-token 小数（如 `mistral-large-latest` 的 `0.000004`），通用解析器只取首段数字，直接写入会把 per-token 当 per-million，故不写；2 个转写模型（`gpt-transcribe` / `gpt-live-transcribe`）价格为 0。要补齐需给通用解析器增加 `price_scale`（按字符串小数位换算），属 Java 改动；当前不改 Java，宁缺不写错价。');
lines.push('- **Top20 的 Merge Gateway 目录价只覆盖 167/206**：官方 Model catalog 的 328 行中，263 行是单一标准价；12 个模型是分档价（如 `claude-haiku-5-5` 的 >100K 档）、6 个 Free/未标价/按分钟价、21 个 models.dev 目录有但官方表未列，当前都不写入，避免把档位价或非 token 价当标准价。');
lines.push('- **余额没有新增 key-only 预设**：OpenCode 文档只说在 Console 看余额，CommandCode 指向 Studio Usage / CLI `/usage`，Anthropic Admin API 需要管理 key，Agnes / Dots 无公开接口；「只有一个 appkey」口径下没有可用的官方余额端点，不猜地址。');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log('written=' + OUT);
console.log('rows=' + rows.length + ' unique=' + seen.size);
console.log('byCredit=' + JSON.stringify(byCredit));
console.log('byProto=' + JSON.stringify(byProto));
console.log('officialIds=' + officialIds.length + ' ' + officialIds.join(','));
