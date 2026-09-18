/**
 * ProviderIcon — 供应商（厂商）图标
 *
 * 按供应商 code / name 解析内置 SVG 图标，未匹配时回退为首字母圆角块
 * （本地字体 + 主色浅底，兼容深色模式）。
 *
 * 参考 openchamber 的 ProviderLogo 体系：
 *   1. 图标数据本地内置（不依赖外链 CDN，离线可用）；
 *   2. 名称先归一化（小写 / 去括号注释 / 取英文 code 段），再查表；
 *   3. 查不到图标时退化为「首字母」占位块，保证任何供应商都能渲染。
 *
 * 供应商 code 与 aiConsoleApi.DEFAULT_MANUFACTURERS 及后端
 * /v2/manufacturer/list 下发的 code 对齐。
 */
import React from 'react';

/* ==================== 内置 SVG 图标数据 ==================== */
/*
 * 图标全部为单色 currentColor 简化几何标识（圆角方 + 首字母 / 简笔字形），
 * 与 ai-page.css 的扁平设计基调一致；彩色品牌标（如 OpenAI 花形 logo）
 * 需引入外部资源，首期不内置，后续可替换为 SVG 资源文件。
 */
const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  // —— 云服务厂商 ——
  openai: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <text x='12' y='12' textAnchor='middle' dominantBaseline='central' fontSize='9' fontWeight='700' fontFamily='inherit'>
        O
      </text>
    </g>
  ),
  anthropic: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M6.5 16.5 12 7.5l5.5 9' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
      <path d='M8.6 13.5h6.8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </g>
  ),
  google: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <circle cx='12' cy='12' r='5' stroke='currentColor' strokeWidth='2' fill='none' />
      <circle cx='12' cy='12' r='1.6' fill='currentColor' />
    </g>
  ),
  deepseek: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M8 8.5v7l4-2.2 4 2.2v-7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  qwen: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <text x='12' y='12' textAnchor='middle' dominantBaseline='central' fontSize='9' fontWeight='700' fontFamily='inherit'>
        通
      </text>
    </g>
  ),
  zhipu: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <rect x='6.5' y='6.5' width='11' height='11' rx='3' stroke='currentColor' strokeWidth='2' fill='none' />
      <path d='M9.5 12h5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </g>
  ),
  baidu: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M8 16V8l4 5 4-5v8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  xfyun: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <circle cx='12' cy='12' r='5.5' stroke='currentColor' strokeWidth='1.8' fill='none' />
      <path d='m9.8 14.2 1.4-1.4 1.4 1.4 1.4-1.4' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' fill='none' />
      <path d='M8.5 10h7' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
    </g>
  ),
  moonshot: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M15.5 8.5a5 5 0 1 0 0 7 4.2 4.2 0 0 1 0-7Z' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' fill='none' />
      <circle cx='15' cy='8.5' r='1.2' fill='currentColor' />
    </g>
  ),
  minimax: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='m7 16 4-8 4 8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
      <path d='m14.5 16 2.5-5 2.5 5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  kling: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M8 8.5v7M12 8.5v7l5-3.5-5-3.5Z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  midjourney: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <text x='12' y='12' textAnchor='middle' dominantBaseline='central' fontSize='9' fontWeight='700' fontFamily='inherit'>
        MJ
      </text>
    </g>
  ),
  stability: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <text x='12' y='12' textAnchor='middle' dominantBaseline='central' fontSize='9' fontWeight='700' fontFamily='inherit'>
        S
      </text>
    </g>
  ),
  paddle: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M12 6.5c-3.5 0-6 2.6-6 6.4V19M12 6.5c3.5 0 6 2.6 6 6.4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' fill='none' />
      <path d='M6 13c4 0 4 3.5 8 3.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' fill='none' />
    </g>
  ),
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
  mediapipe: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <rect x='7' y='7' width='10' height='10' rx='2' stroke='currentColor' strokeWidth='2' fill='none' />
      <path d='M12 10.5v3M10.5 12h3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </g>
  ),
  // —— 本地运行时 ——
  ollama: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <circle cx='9' cy='12' r='4.5' stroke='currentColor' strokeWidth='1.8' fill='none' />
      <circle cx='15' cy='12' r='4.5' stroke='currentColor' strokeWidth='1.8' fill='none' />
    </g>
  ),
  onnx: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='m7 15 5-6 5 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
      <path d='M7 10l5 6 5-6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  pytorch: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M8 15.5 12 8l4 7.5h-2.4L12 12.3l-1.6 3.2Z' stroke='currentColor' strokeWidth='1.6' strokeLinejoin='round' fill='none' />
    </g>
  ),
  tensorflow: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='m12 6.5 5 3v6l-5 3-5-3v-6Z' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round' fill='none' />
      <path d='M12 6.5v11M7 9.5l10 6M17 9.5l-10 6' stroke='currentColor' strokeWidth='1.2' strokeLinecap='round' opacity='.6' />
    </g>
  ),
  triton: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M6.5 14.5 12 7l5.5 7.5h-4M9 17.5h6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' fill='none' />
    </g>
  ),
  python: (
    <g>
      <rect width='24' height='24' rx='6' fill='currentColor' opacity='.1' />
      <path d='M12 6.5c-1.6 0-2.9.8-2.9 2.4v2.1h5.4v-1c0-1.9-1-3.5-2.5-3.5Z' stroke='currentColor' strokeWidth='1.6' strokeLinejoin='round' fill='none' />
      <path d='M12 17.5c1.6 0 2.9-.8 2.9-2.4v-2.1H9.5v1c0 1.9 1 3.5 2.5 3.5Z' stroke='currentColor' strokeWidth='1.6' strokeLinejoin='round' fill='none' />
    </g>
  ),
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
};

/* 供应商 code 别名 → 图标键（归一化前匹配） */
const PROVIDER_ALIAS: Record<string, string> = {
  gemini: 'google',
  claude: 'anthropic',
  'google-ai': 'google',
  chatgpt: 'openai',
  gpt: 'openai',
  ernie: 'baidu',
  wenxin: 'baidu',
  qianfan: 'baidu',
  spark: 'xfyun',
  'iflytek': 'xfyun',
  kimi: 'moonshot',
  glm: 'zhipu',
  'chatglm': 'zhipu',
  tongyi: 'qwen',
  'aliyun-ai': 'qwen',
};

/**
 * 归一化供应商标识：小写 → 去除「（...）」中文注释 / 英文括号注释 → 取英文 code 段。
 * 例："通义千问（阿里云）" → "通义千问" → 别名表无命中时保持原样。
 */
export function normalizeProviderKey(raw?: string | null): string {
  if (!raw) return '';
  let s = String(raw).trim().toLowerCase();
  // 去掉括号注释段
  s = s.replace(/[（(][^（）()]*[）)]/g, ' ').replace(/\s+/g, ' ').trim();
  // 取 ASCII 段（供应商 code 一般为纯英文，如 "ollama（本地大模型）" → "ollama"）
  const m = s.match(/[a-z0-9][a-z0-9-]*/);
  if (m) s = m[0];
  else s = s.replace(/\s+/g, '-');
  return s;
}

/**
 * 解析供应商图标键：归一化后先查别名表，再查图标表。
 * @returns 图标表中的键；无图标时返回 null
 */
export function resolveProviderIconKey(provider?: string | null): string | null {
  const key = normalizeProviderKey(provider);
  if (!key) return null;
  const aliased = PROVIDER_ALIAS[key];
  const candidates = aliased ? [aliased, key] : [key];
  for (const c of candidates) {
    if (PROVIDER_ICONS[c]) return c;
  }
  return null;
}

export interface ProviderIconProps {
  /** 供应商 code 或 name（如 "qwen"、"通义千问（阿里云）"） */
  provider?: string | null;
  /** 图标尺寸，默认 16 */
  size?: number;
  className?: string;
  /** 仅渲染 SVG，不渲染首字母回退块 */
  svgOnly?: boolean;
}

/**
 * 供应商图标：内置 SVG 标识 + 首字母回退。
 * 首字母回退使用本地字体 + Arco 变量浅底圆角块，深浅色自动适配。
 */
export function ProviderIcon({ provider, size = 16, className = '', svgOnly = false }: ProviderIconProps) {
  const iconKey = resolveProviderIconKey(provider);
  if (iconKey) {
    const c = size * 2; // SVG 内部按 24 网格绘制
    return (
      <svg
        className={`ai-provider-icon shrink-0 ${className}`}
        viewBox='0 0 24 24'
        width={c}
        height={c}
        aria-hidden='true'
        style={{ color: 'var(--color-text-2, #5c5c66)' }}
      >
        {PROVIDER_ICONS[iconKey]}
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
      style={{ width: size * 2, height: size * 2, fontSize: size * 0.9 }}
      aria-hidden='true'
    >
      {ch}
    </span>
  );
}

/** 导出图标表，供其它组件（如下拉选项）直接按 key 取图标 */
export { PROVIDER_ICONS };
