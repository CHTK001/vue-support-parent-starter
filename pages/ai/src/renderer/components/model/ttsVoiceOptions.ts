/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Candidate voice ids offered by the TTS variant of `TaskModelSelect`.
 *
 * The field is free text on purpose — every provider names its voices
 * differently and new ones ship constantly, so a closed list would go stale and
 * block a voice that works. Suggestions are keyed by the exact persisted
 * speech-synthesis protocol, never by provider platform: one provider may host
 * models backed by different adapters. Anything else gets an empty candidate
 * list and the user types the id.
 */
const STEPFUN_SYSTEM_VOICES = [
    'cixingnansheng',
    'boyinnansheng',
    'wenrounansheng',
    'shenchennanyin',
    'yuanqinansheng',
    'zhengpaiqingnian',
    'qingniandaxuesheng',
    'wenrougongzi',
    'ruyananshi',
    'jingdiannvsheng',
    'wenrounvsheng',
    'qingchunshaonv',
    'yuanqishaonv',
    'jilingshaonv',
    'tianmeinvsheng',
    'ruanmengnvsheng',
    'linjiajiejie',
    'linjiameimei',
    'zhixingjiejie',
    'shuangkuaijiejie',
    'wenjingxuejie',
    'lengyanyujie',
    'qinqienvsheng',
    'youyanvsheng',
  ] as const;

/**
 * ONNX 本地 VITS-icefall-zh 中文说话人列表（AISHELL3，174 个）。
 * 列表由模型 speakers.txt 顺序决定，对应 speaker id 0~173。
 */
const ONNX_VITS_ZH_VOICES = [
  'SSB0005','SSB0009','SSB0011','SSB0012','SSB0016','SSB0018','SSB0033','SSB0038',
  'SSB0043','SSB0057','SSB0073','SSB0080','SSB0112','SSB0122','SSB0133','SSB0139',
  'SSB0145','SSB0149','SSB0193','SSB0197','SSB0200','SSB0241','SSB0246','SSB0261',
  'SSB0267','SSB0273','SSB0287','SSB0288','SSB0299','SSB0307','SSB0309','SSB0315',
  'SSB0316','SSB0323','SSB0338','SSB0339','SSB0341','SSB0342','SSB0354','SSB0366',
  'SSB0375','SSB0379','SSB0380','SSB0382','SSB0385','SSB0393','SSB0394','SSB0395',
  'SSB0407','SSB0415','SSB0426','SSB0427','SSB0434','SSB0435','SSB0470','SSB0482',
  'SSB0502','SSB0534','SSB0535','SSB0539','SSB0544','SSB0565','SSB0570','SSB0578',
  'SSB0588','SSB0590','SSB0594','SSB0599','SSB0601','SSB0603','SSB0606','SSB0607',
  'SSB0609','SSB0614','SSB0623','SSB0629','SSB0631','SSB0632','SSB0666','SSB0668',
  'SSB0671','SSB0686','SSB0700','SSB0710','SSB0720','SSB0723','SSB0737','SSB0746',
  'SSB0748','SSB0751','SSB0758','SSB0760','SSB0762','SSB0778','SSB0780','SSB0784',
  'SSB0786','SSB0794','SSB0817','SSB0851','SSB0863','SSB0871','SSB0887','SSB0913',
  'SSB0915','SSB0919','SSB0935','SSB0966','SSB0987','SSB1008','SSB1020','SSB1024',
  'SSB1050','SSB1055','SSB1056','SSB1064','SSB1072','SSB1091','SSB1096','SSB1100',
  'SSB1108','SSB1115','SSB1125','SSB1131','SSB1136','SSB1138','SSB1161','SSB1203',
  'SSB1204','SSB1218','SSB1221','SSB1253','SSB1320','SSB1341','SSB1366','SSB1377',
  'SSB1383','SSB1385','SSB1392','SSB1393','SSB1408','SSB1431','SSB1437','SSB1448',
  'SSB1555','SSB1563','SSB1567','SSB1575','SSB1585','SSB1593','SSB1607','SSB1624',
  'SSB1625','SSB1630','SSB1650','SSB1670','SSB1684','SSB1686','SSB1699','SSB1711',
  'SSB1759','SSB1806','SSB1828','SSB1831','SSB1832','SSB1837','SSB1846','SSB1863',
  'SSB1878','SSB1891','SSB1918','SSB1935','SSB1939','SSB1956',
] as const;

export const TTS_VOICE_OPTIONS_BY_PROTOCOL: Record<string, readonly string[]> = {
  'openai.audio_speech': ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  // StepFun (阶跃星辰) system voices for the current
  // `stepaudio-2.5-tts` surface. Both the metered API and Step Plan use these
  // ids. The control remains free text so newly published or cloned voices do
  // not have to wait for an application release.
  'stepfun.audio_speech': STEPFUN_SYSTEM_VOICES,
  // onnx 本地模型语音选项（VITS-icefall-zh 174 个中文说话人）
  'onnx.audio_speech': ONNX_VITS_ZH_VOICES,
};

const SILICONFLOW_SYSTEM_VOICES = [
  'alex',
  'benjamin',
  'charles',
  'david',
  'anna',
  'bella',
  'claire',
  'diana',
] as const;

/**
 * SiliconFlow system voices are model-scoped ids. Keep this map exact and
 * deliberately small: synthesizing `<any-model>:alex` would make a plausible
 * looking value that the selected model may not support. Unknown/new models
 * get no guesses and retain the free-text field for a current system id or a
 * user-created `speech:...` URI.
 */
const SILICONFLOW_SYSTEM_VOICES_BY_MODEL: Readonly<Record<string, readonly string[]>> = {
  'FunAudioLLM/CosyVoice2-0.5B': SILICONFLOW_SYSTEM_VOICES.map(
    (voice) => `FunAudioLLM/CosyVoice2-0.5B:${voice}`
  ),
  'fnlp/MOSS-TTSD-v0.5': SILICONFLOW_SYSTEM_VOICES.map(
    (voice) => `fnlp/MOSS-TTSD-v0.5:${voice}`
  ),
};

export const ttsVoiceOptionsFor = (
  protocol: string | undefined,
  model?: string
): readonly string[] => {
  if (protocol === 'siliconflow.audio_speech') {
    return SILICONFLOW_SYSTEM_VOICES_BY_MODEL[model?.trim() ?? ''] ?? [];
  }
  return (protocol && TTS_VOICE_OPTIONS_BY_PROTOCOL[protocol]) || [];
};

/** Providers whose selected TTS model id already identifies the voice. */
export const ttsUsesModelIdAsVoice = (protocol: string | undefined): boolean =>
  protocol === 'deepgram.speak_rest';

/**
 * 判断 onnx provider 下，voice 字段是否被用作参考音频路径（声音克隆）。
 * Pocket-TTS 的 voice 可以是 wav 文件路径；VITS 的 voice 是说话人名称。
 */
export const ttsIsOnnxVoicePath = (
  protocol: string | undefined,
  model?: string
): boolean => {
  return protocol === 'onnx.audio_speech' && model?.toLowerCase().includes('pocket');
};

/**
 * Protocols whose adapter reads a plain `voice` key out of the saved provider
 * params, so a default voice stored as `provider_params.voice` actually
 * reaches the request.
 *
 * Deliberately a short allowlist, verified against each adapter:
 * - `stepfun.audio_speech` merges provider params and then requires a
 *   non-empty `voice`, so the saved default is what makes it work at all.
 * - `siliconflow.audio_speech` falls back to a configured `voice` when the
 *   request carries none.
 *
 * Everything else is excluded on purpose. MiniMax nests
 * `voice_setting.voice_id`, Volcengine uses `speaker` and xAI uses
 * `voice_id`, so a flat `voice` key is a field they never read. OpenAI reads
 * the right key but writes its typed value (defaulting to `alloy`) AFTER the
 * provider params, which overwrites the saved default. In all of those cases
 * a generic "default voice" box would look accepted and silently do nothing.
 */
const PROTOCOLS_WITH_PROVIDER_PARAM_VOICE = new Set([
  'stepfun.audio_speech',
  'siliconflow.audio_speech',
]);

export const ttsSupportsProviderParamVoice = (protocol: string | undefined): boolean =>
  protocol !== undefined && PROTOCOLS_WITH_PROVIDER_PARAM_VOICE.has(protocol);
