/** 统一能力模型清单接口（与后端 AiModelCatalogController 对齐） */
import { get } from './request';

/** 能力 → 模型 ID 列表 分组 */
export type CapabilityModels = Record<string, string[]>;

/** 统一能力模型清单 API */
export const modelCatalogApi = {
  /** 按能力分组返回全部模型（本地 + 云端） */
  capabilities: () => get<CapabilityModels>('/v2/ai/models/capabilities'),
  /** 指定能力的模型清单 */
  capability: (capability: string) =>
    get<string[]>(`/v2/ai/models/capability/${encodeURIComponent(capability)}`),
  /** 全部能力标签 */
  capabilityNames: () => get<string[]>('/v2/ai/models/capability-names'),
};
