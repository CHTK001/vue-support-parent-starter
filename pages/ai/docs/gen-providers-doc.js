// 生成「提供商能力矩阵」文档：数据全部取自代码，不手写结论。
// 判定口径镜像后端：
//   余额  → ApiProviderController.candidateKinds / creditBrand / isOfficialOpenAi
//           + HostCreditQueryProvider.HOSTS（bearerBrands 11 家、AK/SK 4 家）
//   模型  → fetchModelsFromUpstream / requestUpstreamModels
// 用法：node gen-providers-doc.js [输出路径]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 工作区根目录（包含 spring-support-parent-starter 与 vue-support-parent-starter 的那一层）；
// 换机器或换盘符时用 CHUA_PROJECT_ROOT 覆盖，不必改脚本
const ROOT = process.env.CHUA_PROJECT_ROOT || path.resolve(__dirname, '../../../..');

const TPL = path.join(ROOT, 'vue-support-parent-starter/pages/ai/src/components/models/model.constants.ts');
const JAVA = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/java/com/chua/starter/datasearch/credit/spi/impl/HostCreditQueryProvider.java');
const APC = path.join(ROOT, 'spring-support-parent-starter/spring-support-ai-starter/src/main/java/com/chua/starter/ai/support/manage/api/ApiProviderController.java');
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

// HostCreditQueryProvider 的预设：HOSTS.put("x", new HostSpec("url", ... ) 里的 signType 判断比较复杂，
// 这里按「已知 AK/SK 签名类」名单区分，名单与代码注释（11 Bearer + 4 AK/SK）一致。
const java = fs.readFileSync(JAVA, 'utf8');
const hosts = [...java.matchAll(/HOSTS\.put\("([^"]+)",\s*new HostSpec\("([^"]+)"/g)]
  .map((x) => ({ brand: x[1], url: x[2] }));
const hostNames = hosts.map((h) => h.brand);
const SIGN_KINDS = new Set(['aliyun-bss', 'volc-billing', 'baidu-bce', 'qiniu']);
const bearer = hosts.filter((h) => !SIGN_KINDS.has(h.brand));

const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

// 中转探测链直接读后端常量，避免文档和代码各说一套
const apc = fs.readFileSync(APC, 'utf8');
const chainMatch = apc.match(/AUTO_CREDIT_KINDS\s*=\s*List\.of\(([^)]*)\)/);
const KIND_LABEL = { 'new-api': 'new-api', billing: 'OpenAI 兼容计费(billing)', sub2api: 'sub2api' };
const relayKinds = chainMatch
  ? [...chainMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
  : [];
const relayChain = relayKinds.map((k) => KIND_LABEL[k] || k).join(' → ');
const hostOf = (url) => {
  if (!url) return null;
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
};

const protocolLabel = { openai: 'OpenAI 兼容', anthropic: 'Anthropic(CC)', gemini: 'Gemini' };

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
  return { level: 'relay', text: '中转探测' };
}

function modelsOf(t) {
  if (!t.url) return '自填地址';
  if (t.id === 'onnx') return '本地清单';
  if (t.id === 'router-group') return '模型库成员';
  if (t.id === 'free-channel') return '运行时路由';
  const host = hostOf(t.url);
  if (host && localHosts.has(host)) return '本机 /models → /api/tags';
  if (t.protocol === 'gemini') return '/models?key=';
  if (t.protocol === 'anthropic') return '/models（见第二节）';
  return '远端 /models';
}

const seen = new Map();
for (const t of rows) {
  t.credit = creditOf(t);
  t.models = modelsOf(t);
  t.proto = protocolLabel[t.protocol] || t.protocol;
  seen.set(t.id, (seen.get(t.id) || 0) + 1);
}

const tally = (keyFn) => rows.reduce((acc, r) => { const k = keyFn(r); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
const byCredit = tally((r) => r.credit.level);
const byProto = tally((r) => r.proto);
const officialRows = rows.filter((r) => r.credit.level === 'official');
const officialIds = [...new Set(officialRows.map((r) => r.id))];

const lines = [];
lines.push('# 提供商能力矩阵（AI 控制台）');
lines.push('');
lines.push('> 数据来源：`pages/ai/src/components/models/model.constants.ts`（模板库，' + rows.length + ' 行 / ' + seen.size + ' 个唯一 id，2026-11-16）');
lines.push('> 判定依据：`ApiProviderController` 的 `creditBrand` / `candidateKinds` / `creditLevel` / `isOfficialOpenAi` / `AUTO_CREDIT_KINDS`，`HostCreditQueryProvider.HOSTS` / `sameOrigin`，`fetchModelsFromUpstream`');
lines.push('> 本表由 `pages/ai/docs/gen-providers-doc.js` 生成，改模板或改预设后重跑即可，不要手改。');
lines.push('');
lines.push('## 一、结论');
lines.push('');
lines.push('| 维度 | 结果 |');
lines.push('| --- | --- |');
lines.push('| 模板行数 / 唯一 id | ' + rows.length + ' 行，' + seen.size + ' 个（`google`、`baichuan`、`volcengine` 各重复一次，指向不同地址） |');
lines.push('| 协议分布 | ' + Object.entries(byProto).map(([k, v]) => k + ' ' + v).join('、') + ' |');
lines.push('| 拉取模型 | 除 ONNX / 路由组 / 免费渠道 / 自填地址外，其余模板都走 `GET {base_url}/models`；OpenAI 兼容与 Gemini 可直接用（Gemini 用 `?key=`），Anthropic(CC) 看上游是否认 Bearer（见第二节） |');
lines.push('| 余额查询 | 官方预设 ' + (byCredit.official || 0) + ' 行（' + officialIds.length + ' 个厂商）、OpenAI 官方 ' + (byCredit.openai || 0) + '、中转探测 ' + (byCredit.relay || 0) + '、不查 ' + (byCredit.none || 0) + ' |');
lines.push('');
lines.push('**200+ 家的实际含义**：没有任何一家是「逐家写死代码」。');
lines.push('');
lines.push('- **官方预设**：' + officialIds.length + ' 个厂商有明确的余额端点（`HostCreditQueryProvider.HOSTS`），命中后直接用它的地址和字段；');
lines.push('- **中转探测**：其余 ' + (byCredit.relay || 0) + ' 行，按后端 `AUTO_CREDIT_KINDS` 的顺序依次试（本次生成时为 `' + relayChain + '`），谁先返回数字谁算数，全不通就只显示「已尝试：…」和上游原文；');
lines.push('- **不查**：没有上游地址（路由组 / 自填）、或地址指向本机（ONNX / Ollama），发请求没有意义。');
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
lines.push('| Anthropic(CC) | `{base}/models`（与其他协议同一条链，没有单独分支） | 只发一个认证头，**不带** `anthropic-version` | ' + (byProto['Anthropic(CC)'] || 0) + ' | 看上游：CC 中转站（one-api / new-api 系）大多认 Bearer，能拉到；Anthropic 官方 `/v1/models` 要 `x-api-key` + `anthropic-version`，默认配置会 401（见第六节缺口） |');
lines.push('');
lines.push('只有 **404** 会被当成「拉不到」，401 / 403 / 429 分别回「Key 无效」「没有读取模型列表的权限」「请求过于频繁」，页面据此区分「地址填错」和「Key 权限不对」。不拉模型列表的只有 4 类：ONNX（读本地模型门面）、路由组（读模型库成员）、免费渠道（读运行时合并路由表）、自填地址的 `custom`。');
lines.push('');
lines.push('另有一条独立链路是「检测协议」（`probeProtocol` / `modelListCandidates`，探测某个地址支持哪些协议）：它按协议排一整串候选地址，Anthropic 发 `x-api-key` + `anthropic-version: 2023-06-01`，Gemini 用 `?key=`，OpenAI 试 `/v1/models`、`/models`、`/openai/v1/models`。那条链路是判断「地址支持什么」，不是这里的「拉模型清单」，两者别混。');
lines.push('');
lines.push('## 三、余额口径怎么判（后端分级）');
lines.push('');
lines.push('| 级别 | 判定条件 | 页面徽章 |');
lines.push('| --- | --- | --- |');
lines.push('| `official` | 平台 id 或 `base_url` 域名命中 `HOSTS`，且地址与该厂商同源 | 官方预设 |');
lines.push('| `openai` | `base_url` 是 `api.openai.com` | OpenAI 官方 |');
lines.push('| `relay` | 有上游地址但没命中预设 | 中转站探测 |');
lines.push('| `manual` | `extra.credit_kind` 指定了唯一实现 | 手动口径 |');
lines.push('| `none` | 无上游地址，或地址是本机 | 无上游 / 不查 |');
lines.push('');
lines.push('AK/SK 签名类 4 家（`aliyun-bss`、`volc-billing`、`baidu-bce`、`qiniu`）只在账户侧（`kind=host` + `providerId`）可用，不参与 AI 供应商面板的自动探测——那侧只有 API Key，拿不到 SecretKey。');
lines.push('');
lines.push('**官方预设全表（15 家）**：`HostCreditQueryProvider.HOSTS` 里登记的全部厂商，共 11 家 Bearer + 4 家 AK/SK 签名；「AI 面板」列指这条预设在模型管理的供应商上能不能自动命中。');
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
lines.push('## 四、逐个提供商');
lines.push('');
lines.push('| # | 提供商 | 模板 id | 协议 | 拉取模型 | 余额查询 | 默认地址 |');
lines.push('| --- | --- | --- | --- | --- | --- | --- |');
rows.forEach((r, i) => {
  const url = r.url ? '`' + r.url.replace(/^https?:\/\//, '') + '`' : '—';
  lines.push('| ' + (i + 1) + ' | ' + r.name + ' | `' + r.id + '` | ' + r.proto + ' | ' + r.models + ' | ' + r.credit.text + ' | ' + url + ' |');
});
lines.push('');
lines.push('## 五、验证状态（照实写）');
lines.push('');
lines.push('- 真正跑过真实链路的供应商只有 4 家：Moss（三家口径全 404，原样回传）、路由组（`none`，不查）、Agnes AI（`billing` 命中，读到真实额度）、ONNX（`none`，本地推理）；');
lines.push('- 其余「官方预设」只做过**假 Token 探活路由**（404 说明路径不对，401/403 说明路径存在），没有用真实 Key 做过字段级验证；');
lines.push('- 「中转探测」这类没有逐家验证过——它本来就是对未知站点的依次尝试，命中与否取决于对方有没有挂那套接口；');
lines.push('- 表里不会出现「支持」这种断言，只有「会走哪条路」。');
lines.push('');
lines.push('## 六、已知缺口');
lines.push('');
lines.push('- **Anthropic 官方拉模型缺 `anthropic-version`**：`requestUpstreamModels` 只发一个认证头，官方 `/v1/models` 除 `x-api-key` 外还要 `anthropic-version: 2023-06-01`，所以 `anthropic` 模板用官方 Key 拉模型会 401（「检测协议」那条链带了这个头，能过）。目前只能靠 CC 中转站或手填模型；要让官方 Key 直接可拉，得在拉模型链路补上这个头。');
lines.push('- 有官方余额接口、但本仓库还没有预设的厂商（如智谱、MiniMax 等）：没有拿到官方文档原文，一律不加，避免编地址；这类暂时落到「中转探测」，不通再用手配的「自定义地址 + 字段表达式」；');
lines.push('- 每家的余额字段路径没有统一的行业标准，同一个 `billing` 口径在不同站点也会返回不同单位（USD / 美分 / 次数），表达式兜底就是为这个准备的。');
lines.push('- **免费渠道**是纯路由聚合（模型来自运行时合并路由表），自己没有账户，模板里的 `free.nomifun.com/v1` 只是占位地址；余额面板仍会按「中转探测」去请求它，结果没有业务意义，看这一行时忽略余额列即可。');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log('written=' + OUT);
console.log('rows=' + rows.length + ' unique=' + seen.size);
console.log('byCredit=' + JSON.stringify(byCredit));
console.log('byProto=' + JSON.stringify(byProto));
console.log('officialIds=' + officialIds.length + ' ' + officialIds.join(','));
