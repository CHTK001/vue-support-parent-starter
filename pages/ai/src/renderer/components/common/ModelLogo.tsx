/**
 * ModelLogo — 模型图标
 *
 * 按模型名（name / code）推断所属厂商，再复用 ProviderIcon 的图标表渲染，
 * 因此模型图标与供应商图标天然一致（同一套 currentColor 单色标）。
 *
 * 推断顺序：
 *   1. 整个模型名走供应商解析（覆盖 code 即模型名的情况，如 "deepseek"、"PaddleOCR"）；
 *   2. 取模型名开头的英文词查模型家族表（"qwen2.5-vl-72b" → "qwen"、"glm-4-plus" → "glm"）；
 *   3. 家族前缀（"text-embedding-3-small"、"stable-diffusion-xl" 这类首词判不出的）；
 *   4. 供应商提示（模型行的 providerName / provider code）。
 * 全部落空时回退为模型名首字符圆角块。
 */
import { ProviderIcon, resolveProviderIconKey } from '@/renderer/components/common/ProviderIcon';

/* 模型家族首词 → 供应商图标键 */
const MODEL_FAMILY_ALIAS: Record<string, string> = {
  // OpenAI
  gpt: 'openai',
  chatgpt: 'openai',
  sora: 'openai',
  dall: 'openai',
  dalle: 'openai',
  whisper: 'openai',
  clip: 'openai',
  tts: 'openai',
  davinci: 'openai',
  babbage: 'openai',
  ada: 'openai',
  // Anthropic
  claude: 'anthropic',
  sonnet: 'anthropic',
  opus: 'anthropic',
  haiku: 'anthropic',
  // Google / DeepMind
  gemini: 'gemini',
  gemma: 'google',
  paligemma: 'google',
  palm: 'google',
  bard: 'gemini',
  veo: 'google',
  imagen: 'google',
  t5: 'google',
  // Meta
  llama: 'meta',
  codellama: 'meta',
  sam: 'meta',
  meteora: 'meta',
  siglip: 'meta',
  // xAI / Mistral / Cohere
  grok: 'xai',
  mistral: 'mistral',
  mixtral: 'mistral',
  codestral: 'mistral',
  pixtral: 'mistral',
  ministral: 'mistral',
  devstral: 'mistral',
  command: 'cohere',
  c4ai: 'cohere',
  // DeepSeek / 智谱
  deepseek: 'deepseek',
  glm: 'zhipu',
  chatglm: 'zhipu',
  codegeex: 'zhipu',
  cogvlm: 'zhipu',
  cogview: 'zhipu',
  cogvideo: 'zhipu',
  // 阿里 / 通义
  qwen: 'qwen',
  qwq: 'qwen',
  qvq: 'qwen',
  tongyi: 'qwen',
  ovis: 'qwen',
  wanx: 'qwen',
  gte: 'aliyun',
  paraformer: 'funasr',
  cosyvoice: 'funasr',
  sensevoice: 'funasr',
  sambert: 'funasr',
  funasr: 'funasr',
  // 百度 / 讯飞
  ernie: 'baidu',
  wenxin: 'baidu',
  qianfan: 'baidu',
  paddlevl: 'paddlepaddle',
  paddleocr: 'paddleocr',
  ppocr: 'paddleocr',
  spark: 'xfyun',
  // 月之暗面 / MiniMax / 快手
  kimi: 'kimi',
  moonshot: 'moonshot',
  minimax: 'minimax',
  abab: 'minimax',
  hailuo: 'minimax',
  kling: 'kling',
  // 字节 / 腾讯 / 华为 / 小米
  doubao: 'volcengine',
  seed: 'volcengine',
  seedream: 'volcengine',
  seededit: 'volcengine',
  jimeng: 'volcengine',
  hunyuan: 'tencent',
  pangu: 'huawei',
  ascend: 'huawei',
  mimo: 'xiaomi',
  // 其它国产
  baichuan: 'baichuan',
  yi: 'lingyi',
  step: 'stepfun',
  stepfun: 'stepfun',
  internlm: 'internlm',
  internvl: 'internlm',
  skywork: 'skywork',
  telechat: 'telechat',
  xverse: 'xverse',
  sensechat: 'sensetime',
  noe: 'sensetime',
  reka: 'reka',
  aya: 'cohere',
  // 图像 / 视频
  stable: 'stability',
  sd: 'stability',
  sdxl: 'stability',
  svd: 'stability',
  stablelm: 'stability',
  midjourney: 'midjourney',
  niji: 'midjourney',
  mj: 'midjourney',
  flux: 'flux',
  schnell: 'flux',
  runway: 'runway',
  luma: 'luma',
  pika: 'pika',
  ideogram: 'ideogram',
  recraft: 'recraft',
  pixverse: 'pixverse',
  vidu: 'vidu',
  udio: 'udio',
  suno: 'suno',
  // 语音合成
  chattts: 'chattts',
  fish: 'fishspeech',
  sovits: 'sovits',
  kokoro: 'kokoro',
  bark: 'bark',
  piper: 'piper',
  elevenlabs: 'elevenlabs',
  eleven: 'elevenlabs',
  deepgram: 'deepgram',
  // 云 / 硬件后端
  nemotron: 'nvidia',
  nova: 'aws',
  titan: 'aws',
  phi: 'azure',
  wizardlm: 'azure',
  // 向量 / 检索
  bge: 'baai',
  flag: 'baai',
  jina: 'jina',
  // 视觉 / 检测
  yolo: 'yolo',
  yolov: 'yolo',
  yolo11: 'yolo',
  rtdetr: 'yolo',
  rtmdet: 'openmmlab',
  mmdet: 'openmmlab',
  mmocr: 'openmmlab',
  mmpose: 'openmmlab',
  mmagic: 'openmmlab',
  mmengine: 'openmmlab',
  mmpretrain: 'openmmlab',
  olmo: 'allenai',
  insightface: 'insightface',
  arcface: 'insightface',
  scrfd: 'insightface',
  buffalo: 'insightface',
  mediapipe: 'mediapipe',
  faceanalysis: 'insightface',
  // 本地运行时
  ollama: 'ollama',
  onnx: 'onnx',
  sherpa: 'onnx',
  vllm: 'vllm',
  lmstudio: 'lmstudio',
  triton: 'triton',
  trt: 'nvidia',
  tensorrt: 'nvidia',
  llamacpp: 'llamacpp',
  gguf: 'llamacpp',
  ggml: 'llamacpp',
  comfyui: 'comfyui',
  xinference: 'xinference',
  gpustack: 'gpustack',
  mindspore: 'mindspore',
  modelscope: 'modelscope',
  huggingface: 'huggingface',
  pytorch: 'pytorch',
  torch: 'pytorch',
  tensorflow: 'tensorflow',
  keras: 'tensorflow',
  paddle: 'paddlepaddle',
  openvino: 'intel',
  rocm: 'amd',
};

/* 首词判不出时的家族前缀（子串匹配） */
const MODEL_FAMILY_PREFIXES: Array<[string, string]> = [
  ['text-embedding', 'openai'],
  ['text-embedding-ada', 'openai'],
  ['chat-completions', 'openai'],
  ['dall-e', 'openai'],
  ['o1-', 'openai'],
  ['o3-', 'openai'],
  ['o4-', 'openai'],
  ['stable-diffusion', 'stability'],
  ['segment-anything', 'meta'],
  ['sam2', 'meta'],
  ['wav2vec', 'meta'],
  ['dinov2', 'meta'],
  ['code-llama', 'meta'],
  ['codeellama', 'meta'],
  ['wan2', 'qwen'],
  ['wanxiang', 'qwen'],
  ['so-vits', 'sovits'],
  ['gpt-sovits', 'sovits'],
  ['pp-ocr', 'paddleocr'],
  ['paddle-ocr', 'paddleocr'],
];

/** 家族表里没有精确首词时，按最长前缀匹配（≥5 字符，避免 sd / step 等短词误伤） */
function matchFamilyByHead(head: string): string | null {
  let bestKey: string | null = null;
  let bestLen = 4;
  for (const family of Object.keys(MODEL_FAMILY_ALIAS)) {
    if (family.length > bestLen && head.startsWith(family)) {
      bestKey = MODEL_FAMILY_ALIAS[family];
      bestLen = family.length;
    }
  }
  return bestKey;
}

/**
 * 按模型名 / code 推断供应商图标键。
 * @param nameOrCode 模型名或 code（如 "gpt-4o"、"deepseek-r1-distill-qwen-7b"）
 * @param vendorHint 供应商名 / code（模型行的 providerName，可选）
 */
export function resolveModelIconKey(nameOrCode?: string | null, vendorHint?: string | null): string | null {
  const raw = (nameOrCode ?? '').trim().toLowerCase();
  if (raw) {
    // ① 整体即供应商 code / 名称
    const direct = resolveProviderIconKey(raw);
    if (direct) return direct;
    // ② 去分隔符整体（"RT-DETR" → rtdetr）
    const joined = raw.replace(/[^a-z0-9]/g, '');
    if (MODEL_FAMILY_ALIAS[joined]) return MODEL_FAMILY_ALIAS[joined];
    // ③ 英文首词：精确 → 供应商表 → 最长前缀
    const head = raw.match(/[a-z]+/)?.[0];
    if (head && head.length > 1) {
      const key = MODEL_FAMILY_ALIAS[head] ?? resolveProviderIconKey(head) ?? matchFamilyByHead(head);
      if (key) return key;
    }
    // ④ 家族前缀
    for (const [prefix, key] of MODEL_FAMILY_PREFIXES) {
      if (raw.includes(prefix)) return key;
    }
  }
  // ⑤ 供应商提示
  if (vendorHint) return resolveProviderIconKey(vendorHint);
  return null;
}

export interface ModelLogoProps {
  /** 模型名或模型 code（如 "gpt-4o"、"deepseek-chat"） */
  model?: string | null;
  /** 供应商名 / code（可选提示，如 "DeepSeek"） */
  vendor?: string | null;
  /** 图标尺寸（CSS 像素），默认 16 */
  size?: number;
  className?: string;
}

/** 模型图标：命中厂商则复用供应商图标体系，否则模型名首字符回退。 */
export function ModelLogo({ model, vendor, size = 16, className = '' }: ModelLogoProps) {
  const key = resolveModelIconKey(model, vendor);
  if (key) return <ProviderIcon iconKey={key} size={size} className={`ai-model-logo ${className}`.trim()} />;
  const raw = (model ?? vendor ?? '').trim();
  const ch = raw ? raw[0].toUpperCase() : '?';
  return (
    <span
      className={`ai-model-logo-initial shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.63 }}
      aria-hidden='true'
    >
      {ch}
    </span>
  );
}

export { ProviderIcon } from '@/renderer/components/common/ProviderIcon';
