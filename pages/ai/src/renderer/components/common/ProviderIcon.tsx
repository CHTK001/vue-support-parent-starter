/**
 * ProviderIcon — 供应商（厂商）图标
 *
 * 三层数据源，全部本地内置（不发任何外链请求）：
 *   1. BRAND_ICON_PATHS：52 个主流厂商的真实单色品牌标（simple-icons，构建期内联）；
 *   2. HAND_DRAWN_ICONS：无公开单色品牌标的厂商，用手绘简笔 / 字母 tile；
 *   3. 首字母回退：两张表都没命中时，用供应商名首字符渲染中性圆角块。
 *
 * 解析顺序：归一化（小写 / 去括号注释）→ 拉丁别名表 → 中文子串提示表 → 图标表。
 * 因此 "通义千问（阿里云）"、"百度文心一言"、"Anthropic Claude" 都能命中。
 *
 * 供应商 code 与 aiConsoleApi.DEFAULT_MANUFACTURERS 及后端
 * /v2/manufacturer/list 下发的 code 对齐。
 */
import React from 'react';
import { BRAND_ICON_PATHS } from './brandIconPaths';

/* ==================== 手绘兜底图标 ==================== */

/**
 * 圆角浅底 + 居中标签。fontSize 以 24 网格为单位：
 * 单字 16（≈ 0.67 倍渲染尺寸），双字 11，与首字母回退块的观感保持一致。
 */
const tile = (label: string, fontSize = 16) => (
  <g>
    <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
    <text
      x='12'
      y='12'
      textAnchor='middle'
      dominantBaseline='central'
      fontSize={fontSize}
      fontWeight='700'
      fontFamily='inherit'
    >
      {label}
    </text>
  </g>
);

const HAND_DRAWN_ICONS: Record<string, React.ReactNode> = {
  // —— 大模型云 API：无单色品牌标 / 品牌标已下架 ——
  openai: tile('AI'),
  xfyun: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <circle cx='12' cy='12' r='5.5' stroke='currentColor' strokeWidth='1.8' fill='none' />
      <path d='m9.8 14.2 1.4-1.4 1.4 1.4 1.4-1.4' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' fill='none' />
      <path d='M8.5 10h7' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
    </g>
  ),
  kling: tile('可'),
  midjourney: tile('MJ', 11),
  stability: tile('S'),
  flux: tile('FX', 11),
  groq: tile('GQ', 11),
  cohere: tile('CO', 11),
  together: tile('TG', 11),
  fireworks: tile('FW', 11),
  azure: tile('AZ', 11),
  aws: tile('AW', 11),
  xai: tile('XA', 11),
  volcengine: tile('火'),
  stepfun: tile('阶'),
  baichuan: tile('百'),
  lingyi: tile('零'),
  sensetime: tile('商'),
  noematrix: tile('诺'),
  siliconflow: tile('硅'),
  infinigence: tile('无'),
  reka: tile('RK', 11),
  cerebras: tile('CB', 11),
  sambanova: tile('SB', 11),
  ai21: tile('21', 11),
  alephalpha: tile('AA', 11),
  skywork: tile('天'),
  telechat: tile('星'),
  internlm: tile('书'),
  xverse: tile('象'),
  aihubmix: tile('AH', 11),
  oneapi: tile('OA', 11),
  // —— 图像 / 视频 ——
  runway: tile('RW', 11),
  luma: tile('LM', 11),
  pika: tile('PK', 11),
  ideogram: tile('IG', 11),
  recraft: tile('RC', 11),
  pixverse: tile('PV', 11),
  vidu: tile('VD', 11),
  udio: tile('UD', 11),
  // —— 语音 ——
  funasr: tile('FA', 11),
  chattts: tile('CT', 11),
  fishspeech: tile('FS', 11),
  sovits: tile('SV', 11),
  kokoro: tile('KK', 11),
  bark: tile('BK', 11),
  piper: tile('PI', 11),
  // —— 向量 / 开源社区 ——
  baai: tile('源'),
  jina: tile('JI', 11),
  openmmlab: tile('OM', 11),
  allenai: tile('OL', 11),
  // —— 视觉 / OCR ——
  paddleocr: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M6.5 15.5V8.5h6a4 4 0 0 1 0 8h-2' stroke='currentColor' strokeWidth='2' strokeLinecap='round' fill='none' />
    </g>
  ),
  insightface: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <circle cx='12' cy='10' r='3' stroke='currentColor' strokeWidth='1.8' fill='none' />
      <path d='M5.5 19c1.4-3 4-4.5 6.5-4.5S17.1 16 18.5 19' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' fill='none' />
    </g>
  ),
  // —— 本地推理 / 训练框架 ——
  mindspore: tile('MS', 11),
  triton: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M6.5 14.5 12 7l5.5 7.5h-4M9 17.5h6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  llamacpp: tile('LC', 11),
  xinference: tile('XF', 11),
  gpustack: tile('GS', 11),
  comfyui: tile('CF', 11),
  fastdeploy: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M7 8h8M9 12h8M11 16h6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      <path d='m16 8 2.5 4L16 16' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  'local-file': (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M8 6.5h4.5L16 10v7.5H8Z' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round' fill='none' />
      <path d='M12 6.5V10h3.5' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round' fill='none' />
    </g>
  ),
  // —— 向量库 / 编排 ——
  chroma: tile('CH', 11),
  weaviate: tile('WV', 11),
  pinecone: tile('PC', 11),
  ragflow: tile('RF', 11),
  llamaindex: tile('LX', 11),
  langflow: tile('LF', 11),
};

/** 供应商 code / 名称 → 图标节点（品牌 path 优先，手绘兜底） */
export const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  ...BRAND_ICON_PATHS,
  ...HAND_DRAWN_ICONS,
};

/* ==================== 名称归一化与别名 ==================== */

/** 拉丁 code / 产品名 → 图标键（键为归一化后的小写形式） */
const PROVIDER_ALIAS: Record<string, string> = {
  // OpenAI 系
  chatgpt: 'openai',
  gpt: 'openai',
  sora: 'openai',
  'dall-e': 'openai',
  dalle: 'openai',
  whisper: 'openai',
  'azure-openai': 'openai',
  openai_azure: 'openai',
  // Anthropic / Google
  claude: 'anthropic',
  'google-ai': 'google',
  'google-ai-studio': 'google',
  bard: 'gemini',
  palm: 'google',
  palm2: 'google',
  vertex: 'google',
  'vertex-ai': 'google',
  deepmind: 'deepmind',
  // Meta
  llama: 'meta',
  'llama-2': 'meta',
  'llama-3': 'meta',
  codellama: 'meta',
  'code-llama': 'meta',
  // 阿里 / 通义
  tongyi: 'qwen',
  qianwen: 'qwen',
  dashscope: 'qwen',
  wanxiang: 'qwen',
  'tongyi-wanxiang': 'qwen',
  alibaba: 'aliyun',
  bailian: 'aliyun',
  paraformer: 'funasr',
  cosyvoice: 'funasr',
  sensevoice: 'funasr',
  // 智谱
  glm: 'zhipu',
  chatglm: 'zhipu',
  'zhipu-ai': 'zhipu',
  zai: 'zhipu',
  qingyan: 'zhipu',
  cogvlm: 'zhipu',
  cogview: 'zhipu',
  // 百度
  ernie: 'baidu',
  'ernie-bot': 'baidu',
  wenxin: 'baidu',
  qianfan: 'baidu',
  'baidu-ai': 'baidu',
  // 讯飞
  spark: 'xfyun',
  iflytek: 'xfyun',
  'spark-desk': 'xfyun',
  // 月之暗面 / MiniMax / 快手
  'moonshot-ai': 'moonshot',
  abab: 'minimax',
  hailuo: 'minimax',
  'minimax-hailuo': 'minimax',
  keling: 'kling',
  'kuaishou-ai': 'kuaishou',
  // 字节 / 腾讯 / 华为 / 小米
  doubao: 'volcengine',
  ark: 'volcengine',
  'volc-ark': 'volcengine',
  jimeng: 'volcengine',
  seed: 'volcengine',
  'tencent-ai': 'tencent',
  hunyuan: 'tencent',
  'hunyuan-ai': 'tencent',
  pangu: 'huawei',
  ascend: 'huawei',
  cann: 'huawei',
  mimo: 'xiaomi',
  'xiaomi-ai': 'xiaomi',
  // 其它云 / 网关
  'microsoft-azure': 'azure',
  microsoft: 'azure',
  amazon: 'aws',
  'amazon-bedrock': 'aws',
  bedrock: 'aws',
  'aws-bedrock': 'aws',
  'nvidia-nim': 'nvidia',
  nim: 'nvidia',
  tensorrt: 'nvidia',
  trt: 'nvidia',
  'trt-llm': 'nvidia',
  openvino: 'intel',
  rocm: 'amd',
  'together-ai': 'together',
  togetherai: 'together',
  'fireworks-ai': 'fireworks',
  fireworksai: 'fireworks',
  'mistral-ai': 'mistral',
  '01-ai': 'lingyi',
  '01ai': 'lingyi',
  yi: 'lingyi',
  'step-1': 'stepfun',
  step: 'stepfun',
  zilliz: 'milvus',
  'hugging-face': 'huggingface',
  hf: 'huggingface',
  transformers: 'huggingface',
  diffusers: 'huggingface',
  tgi: 'huggingface',
  'text-generation-inference': 'huggingface',
  wandb: 'weightsandbiases',
  weightsbiases: 'weightsandbiases',
  googlegemini: 'gemini',
  googlecloud: 'gcp',
  vertexai: 'google',
  azureopenai: 'openai',
  gptsovits: 'sovits',
  'ollama-webui': 'ollama',
  'lm-studio': 'lmstudio',
  'llama-cpp': 'llamacpp',
  'llama.cpp': 'llamacpp',
  ggml: 'llamacpp',
  gguf: 'llamacpp',
  'comfy-ui': 'comfyui',
  comfy: 'comfyui',
  onnxruntime: 'onnx',
  'onnx-runtime': 'onnx',
  sherpa: 'onnx',
  'sherpa-onnx': 'onnx',
  torch: 'pytorch',
  keras: 'tensorflow',
  tf: 'tensorflow',
  paddle: 'paddlepaddle',
  'paddle-paddle': 'paddlepaddle',
  paddlenlp: 'paddlepaddle',
  paddledet: 'paddlepaddle',
  ppocr: 'paddleocr',
  'pp-ocr': 'paddleocr',
  ppstructure: 'paddleocr',
  cv2: 'opencv',
  yolov5: 'yolo',
  yolov8: 'yolo',
  yolov11: 'yolo',
  rtdetr: 'yolo',
  'ultralytics-yolo': 'yolo',
  arcface: 'insightface',
  scrfd: 'insightface',
  buffalo: 'insightface',
  faceanalysis: 'insightface',
  'stable-diffusion': 'stability',
  'stability-ai': 'stability',
  stabilityai: 'stability',
  moonshotai: 'moonshot',
  'black-forest-labs': 'flux',
  bfl: 'flux',
  '11labs': 'elevenlabs',
  'eleven-labs': 'elevenlabs',
  mj: 'midjourney',
  local: 'local-file',
  localfile: 'local-file',
  file: 'local-file',
  upload: 'local-file',
  py: 'python',
  'llama-index': 'llamaindex',
  'rag-flow': 'ragflow',
  sf: 'siliconflow',
};

/**
 * 中文厂商名提示（子串匹配）：厂商 name 常带中文，如 "百度文心一言"、"通义千问（阿里云）"。
 * 按从具体到宽泛排列，命中即取第一个。
 */
const CJK_NAME_HINTS: Array<[string, string]> = [
  ['通义千问', 'qwen'],
  ['通义', 'qwen'],
  ['万相', 'qwen'],
  ['千问', 'qwen'],
  ['阿里云', 'aliyun'],
  ['百炼', 'aliyun'],
  ['智谱', 'zhipu'],
  ['清言', 'zhipu'],
  ['清影', 'zhipu'],
  ['文心一言', 'baidu'],
  ['文心', 'baidu'],
  ['千帆', 'baidu'],
  ['百度', 'baidu'],
  ['飞桨', 'paddlepaddle'],
  ['讯飞', 'xfyun'],
  ['星火', 'xfyun'],
  ['月之暗面', 'moonshot'],
  ['暗面', 'moonshot'],
  ['百川', 'baichuan'],
  ['零一', 'lingyi'],
  ['阶跃', 'stepfun'],
  ['混元', 'tencent'],
  ['腾讯', 'tencent'],
  ['元宝', 'tencent'],
  ['豆包', 'volcengine'],
  ['火山', 'volcengine'],
  ['即梦', 'volcengine'],
  ['盘古', 'huawei'],
  ['华为', 'huawei'],
  ['昇腾', 'huawei'],
  ['昇思', 'mindspore'],
  ['小米', 'xiaomi'],
  ['可灵', 'kling'],
  ['快手', 'kuaishou'],
  ['海螺', 'minimax'],
  ['硅基流动', 'siliconflow'],
  ['商汤', 'sensetime'],
  ['日日新', 'sensetime'],
  ['书生', 'internlm'],
  ['星辰', 'telechat'],
  ['昆仑万维', 'skywork'],
  ['天工', 'skywork'],
  ['魔搭', 'modelscope'],
  ['本地文件', 'local-file'],
  ['无问芯穹', 'infinigence'],
  ['爱诗', 'pixverse'],
  ['生数', 'vidu'],
  ['象讯', 'xverse'],
  ['元象', 'xverse'],
  ['诺斯', 'noematrix'],
];

/**
 * 归一化供应商标识：小写 → 去除「（...）」中文注释 / 英文括号注释 → 取英文 code 段。
 * 例："Ollama（本地大模型）" → "ollama"；"通义千问（阿里云）" → "通义千问"。
 */
export function normalizeProviderKey(raw?: string | null): string {
  if (!raw) return '';
  let s = String(raw).trim().toLowerCase();
  // 去掉括号注释段
  s = s.replace(/[（(][^（）()]*[）)]/g, ' ').replace(/\s+/g, ' ').trim();
  // 取 ASCII 段（供应商 code 一般为纯英文，如 "ollama（本地大模型）" → "ollama"）
  const m = s.match(/[a-z0-9][a-z0-9._-]*/);
  if (m) s = m[0].replace(/[._-]+$/, '');
  else s = s.replace(/\s+/g, '-');
  return s;
}

/** 候选图标键：先去分隔符的整体拼写（"Hugging Face" → huggingface），再去首词 */
function providerKeyCandidates(raw: string): string[] {
  const candidates: string[] = [];
  const joined = raw.replace(/[（(][^（）()]*[）)]/g, ' ').replace(/[^a-z0-9]/g, '');
  if (joined) candidates.push(joined);
  const first = normalizeProviderKey(raw);
  if (first && !candidates.includes(first)) candidates.push(first);
  return candidates;
}

/** 解析供应商图标键：候选键（别名 → 图标表）→ 中文名子串提示 */
export function resolveProviderIconKey(provider?: string | null): string | null {
  if (!provider) return null;
  const raw = String(provider).trim().toLowerCase();
  for (const candidate of providerKeyCandidates(raw)) {
    const aliased = PROVIDER_ALIAS[candidate];
    if (aliased && PROVIDER_ICONS[aliased]) return aliased;
    if (PROVIDER_ICONS[candidate]) return candidate;
  }
  for (const [hint, iconKey] of CJK_NAME_HINTS) {
    if (raw.includes(hint) && PROVIDER_ICONS[iconKey]) return iconKey;
  }
  return null;
}

/* ==================== 渲染 ==================== */

/** 品牌 path 数据渲染为 <path>，手绘条目本身即 <g> */
function renderIconNode(node: React.ReactNode) {
  return typeof node === 'string' ? <path d={node} fill='currentColor' /> : node;
}

export interface ProviderIconProps {
  /** 供应商 code 或 name（如 "qwen"、"通义千问（阿里云）"） */
  provider?: string | null;
  /** 直接指定图标键（跳过名称解析）；ModelLogo 按模型名推断后走这条路径 */
  iconKey?: string | null;
  /** 图标尺寸（CSS 像素），默认 16 */
  size?: number;
  className?: string;
  /** 仅渲染 SVG，不渲染首字母回退块 */
  svgOnly?: boolean;
}

/**
 * 供应商图标：内置品牌标 / 手绘标 + 首字母回退。
 * 全部 currentColor，深浅色主题自动适配；首字母回退用本地字体 + Arco 变量底色。
 */
export function ProviderIcon({ provider, iconKey: iconKeyProp, size = 16, className = '', svgOnly = false }: ProviderIconProps) {
  const iconKey = iconKeyProp ?? resolveProviderIconKey(provider);
  const node = iconKey ? PROVIDER_ICONS[iconKey] : undefined;
  if (node) {
    return (
      <svg
        className={`ai-provider-icon shrink-0 ${className}`}
        viewBox='0 0 24 24'
        width={size}
        height={size}
        aria-hidden='true'
        style={{ color: 'var(--color-text-2, #5c5c66)' }}
      >
        {renderIconNode(node)}
      </svg>
    );
  }
  if (svgOnly) return null;
  // 首字母回退：取供应商名第一个可识别字符
  const raw = (provider ?? '').trim();
  const ch = raw ? raw[0].toUpperCase() : '?';
  return (
    <span
      className={`ai-provider-initial shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.63 }}
      aria-hidden='true'
    >
      {ch}
    </span>
  );
}
