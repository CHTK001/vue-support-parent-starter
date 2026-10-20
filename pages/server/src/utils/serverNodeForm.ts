/**
 * 服务管理 —— 节点表单的纯逻辑（校验 + 请求体组装）。
 *
 * <p><b>为什么单独抽出来</b>：这两段逻辑原先内嵌在
 * {@code ScServerFormDrawer.vue} 的 {@code validate()} / {@code buildPayload()} 里，
 * 只能靠挂载整个抽屉（含 Element Plus 表单）才能测到。它们恰恰是最容易出错、
 * 也最需要回归保护的部分：
 * <ul>
 *   <li>代理类协议缺 {@code backendHost/backendPort} 时，后端虽然会快速失败，
 *       但用户看到的是"建出来就是 ERROR"；前端先拦一次体验更好；</li>
 *   <li>过滤器链里的 {@code name} 必须唯一，否则后端/链路定位会歧义；</li>
 *   <li>自定义实现必须下发**真实 FQCN**，不能把元数据里那句说明文字当类型。</li>
 * </ul>
 *
 * <p>抽成纯函数后，这些规则可以用普通单测覆盖，不必启动浏览器。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

import type { ServerFilterDescriptor, ServerNodeRequest } from '../api';

/** 表单模型（与抽屉里的 ref 结构一致） */
export interface ServerNodeFormModel {
  name: string;
  protocol: string;
  engine: string;
  host: string;
  port: number | null;
  enabled: number;
  remark: string;
  config: Record<string, unknown>;
  filters: ServerFilterDescriptor[];
}

/** 校验所需的外部事实（来自协议元数据） */
export interface ServerNodeFormFacts {
  /** 该协议是否必须提供后端地址（ProtocolMeta.requiresBackend） */
  requiresBackend: boolean;
}

/** 校验结果 */
export interface ValidationResult {
  ok: boolean;
  /** 不通过时的可展示文案 */
  message?: string;
}

/**
 * 校验节点表单。
 *
 * @param form  表单模型
 * @param facts 协议元数据事实
 * @param existingNames 列表中已存在的其他节点名称（用于名称重复校验）；传入空数组则跳过
 * @returns 校验结果；{@code ok=false} 时 {@code message} 可直接提示给用户
 */
export function validateServerNodeForm(
  form: ServerNodeFormModel,
  facts: ServerNodeFormFacts,
  existingNames?: string[],
): ValidationResult {
  const name = String(form.name ?? '').trim();
  if (!name) {
    return { ok: false, message: '请填写服务名称' };
  }
  if (!form.protocol) {
    return { ok: false, message: '请选择协议类型' };
  }
  // 用 == null 判断：port=0 是合法值但 !port===true，不能用 ! 判空
  if (form.port == null) {
    return { ok: false, message: '请填写监听端口' };
  }
  if (form.port < 1 || form.port > 65535) {
    return { ok: false, message: '端口必须在 1-65535 范围内' };
  }
  if (facts.requiresBackend) {
    const host = form.config?.backendHost;
    const port = form.config?.backendPort;
    if (!isFilled(host) || !isFilled(port)) {
      return { ok: false, message: '代理类服务必须填写后端地址与后端端口' };
    }
  }
  const names = form.filters.map(f => f.name);
  if (new Set(names).size !== names.length) {
    return { ok: false, message: '过滤器名称存在重复，请调整后再保存' };
  }
  const emptyType = form.filters.find(f => !String(f.type ?? '').trim());
  if (emptyType) {
    return { ok: false, message: `插件 ${emptyType.name} 缺少类型，请重新添加` };
  }
  // 名称重复校验：传入 existingNames 时同名即拦
  if (existingNames?.length && existingNames.includes(name)) {
    return { ok: false, message: `服务名称「${name}」已存在，请换一个` };
  }
  return { ok: true };
}

/**
 * 组装创建/更新/热更新的请求体。
 *
 * @param form 表单模型
 * @returns 后端 {@code ServerNodeRequest} 结构
 */
export function buildServerNodePayload(form: ServerNodeFormModel): ServerNodeRequest {
  return {
    name: form.name.trim(),
    protocol: form.protocol,
    engine: form.engine,
    host: form.host || '0.0.0.0',
    port: form.port,
    enabled: form.enabled,
    remark: form.remark,
    config: form.config || {},
    filters: form.filters.map(f => ({
      name: f.name,
      type: f.type,
      order: f.order,
      enabled: f.enabled !== false,
      params: f.params || {},
    })),
  };
}

/**
 * 值是否算"已填写"（0 与 false 是合法值，不能被当成空）。
 *
 * @param value 原始值
 * @returns 是否已填写
 */
function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  const text = String(value).trim();
  return text.length > 0;
}
