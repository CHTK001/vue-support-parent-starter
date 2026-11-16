// 生成 datasearch 随包发布的模型目录快照：provider-catalog/models-dev.json.gz
//
// 数据源：
//   1. 限制登记表 provider-catalog/provider-limit-docs.json —— 厂商键、别名、主机名、官方文档入口
//   2. https://models.dev/api.json —— 模型说明、目录价、上下文、模态、能力位
//
// 产物只保留后端用到的字段，gzip 后约 0.42 MB（原始 4 MB）。
// 用法：node gen-model-snapshot.mjs [models-dev.json 缓存路径]
//   缓存不存在时会联网下载；断网重跑会直接失败，不会写半份快照。
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.CHUA_PROJECT_ROOT || path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/resources/provider-catalog/provider-limit-docs.json');
const OUT_DIR = path.join(ROOT, 'spring-support-parent-starter/spring-support-datasearch-starter/src/main/resources/provider-catalog');
const CACHE = process.argv[2] || path.join(ROOT, '_tmp_cleanup/models-dev.json');
const SOURCE = 'https://models.dev/api.json';

const KEEP = (m) => ({
  id: m.id,
  name: m.name,
  description: m.description ?? null,
  attachment: m.attachment ?? null,
  reasoning: m.reasoning ?? null,
  tool_call: m.tool_call ?? null,
  structured_output: m.structured_output ?? null,
  temperature: m.temperature ?? null,
  knowledge: m.knowledge ?? null,
  release_date: m.release_date ?? null,
  last_updated: m.last_updated ?? null,
  modalities: m.modalities ?? null,
  open_weights: m.open_weights ?? null,
  limit: m.limit ?? null,
  cost: m.cost ?? null,
});

async function loadCatalog() {
  if (fs.existsSync(CACHE)) {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  }
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`下载 ${SOURCE} 失败：HTTP ${res.status}`);
  const text = await res.text();
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, text);
  return JSON.parse(text);
}

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const catalog = await loadCatalog();
const snapshot = {
  source: SOURCE,
  generated_at: new Date().toISOString().slice(0, 10),
  providers: {},
};

for (const entry of registry.entries) {
  const provider = catalog[entry.id];
  if (!provider || !provider.models) continue;
  const models = {};
  for (const [id, model] of Object.entries(provider.models)) {
    models[id] = KEEP(model);
  }
  snapshot.providers[entry.id] = {
    id: entry.id,
    name: provider.name ?? entry.name,
    doc: provider.doc ?? entry.doc ?? null,
    aliases: entry.aliases,
    hosts: entry.hosts,
    models,
  };
}

// 同一 models.dev 厂商可能被多个模板 id 引用，这里按最终快照去重后计数
const modelCountFinal = Object.values(snapshot.providers)
  .reduce((sum, p) => sum + Object.keys(p.models).length, 0);

const json = JSON.stringify(snapshot);
const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'models-dev.json.gz'), gz);

console.log('providers =', Object.keys(snapshot.providers).length, 'models =', modelCountFinal);
console.log('json MB =', (Buffer.byteLength(json) / 1048576).toFixed(2), ' gz MB =', (gz.length / 1048576).toFixed(2));
