/**
 * 服务管理节点表单纯逻辑单测。
 *
 * <p>这些规则原本埋在抽屉组件里，只能挂载整页才能测；抽成纯函数后在此直接覆盖。
 * 失败信息一律断言"因正确原因失败"，避免把 `ok=false` 当成唯一判据。</p>
 */
import { describe, expect, it } from 'vitest';
import {
  buildServerNodePayload,
  validateServerNodeForm,
  type ServerNodeFormModel,
} from '../utils/serverNodeForm';

function form(overrides: Partial<ServerNodeFormModel> = {}): ServerNodeFormModel {
  return {
    name: 'svc-1',
    protocol: 'http',
    engine: 'jdk',
    host: '0.0.0.0',
    port: 18080,
    enabled: 1,
    remark: '',
    config: {},
    filters: [],
    ...overrides,
  };
}

const HTTP = { requiresBackend: false };
const PROXY = { requiresBackend: true };

describe('validateServerNodeForm', () => {
  it('正常表单通过', () => {
    expect(validateServerNodeForm(form(), HTTP)).toEqual({ ok: true });
  });

  it('缺名称/协议/端口分别给出对应提示', () => {
    expect(validateServerNodeForm(form({ name: '  ' }), HTTP).message).toBe('请填写服务名称');
    expect(validateServerNodeForm(form({ protocol: '' }), HTTP).message).toBe('请选择协议类型');
    expect(validateServerNodeForm(form({ port: null }), HTTP).message).toBe('请填写监听端口');
  });

  it('代理类协议缺后端时拦下，并明确指向后端地址/端口', () => {
    const r = validateServerNodeForm(form({ protocol: 'http-proxy' }), PROXY);
    expect(r.ok).toBe(false);
    expect(r.message).toBe('代理类服务必须填写后端地址与后端端口');

    const onlyHost = form({ protocol: 'http-proxy', config: { backendHost: '127.0.0.1' } });
    expect(validateServerNodeForm(onlyHost, PROXY).ok).toBe(false);
  });

  it('代理后端端口为 0 或字符串数字都视为已填写（合法边界）', () => {
    const zeroPort = form({
      protocol: 'http-proxy',
      config: { backendHost: '127.0.0.1', backendPort: 0 },
    });
    expect(validateServerNodeForm(zeroPort, PROXY).ok).toBe(true);

    const stringPort = form({
      protocol: 'tcp-proxy',
      config: { backendHost: '127.0.0.1', backendPort: '8112' },
    });
    expect(validateServerNodeForm(stringPort, PROXY).ok).toBe(true);
  });

  it('非代理协议不要求后端', () => {
    expect(validateServerNodeForm(form({ protocol: 'ftp' }), HTTP).ok).toBe(true);
  });

  it('过滤器名称重复时拦下（同名会让链上定位歧义）', () => {
    const r = validateServerNodeForm(
      form({
        filters: [
          { name: 'fs', type: 'file-storage', order: 100, enabled: true, params: {} },
          { name: 'fs', type: 'file-storage', order: 110, enabled: true, params: {} },
        ],
      }),
      HTTP,
    );
    expect(r.ok).toBe(false);
    expect(r.message).toBe('过滤器名称存在重复，请调整后再保存');
  });

  it('过滤器缺类型时拦下（自定义实现未填 FQCN 的兜底）', () => {
    const r = validateServerNodeForm(
      form({ filters: [{ name: 'custom', type: '', order: 100, enabled: true, params: {} }] }),
      HTTP,
    );
    expect(r.ok).toBe(false);
    expect(r.message).toContain('custom');
  });

  it('端口超范围拦下（1 以下 / 65535 以上）', () => {
    expect(validateServerNodeForm(form({ port: 0 }), HTTP).message).toBe('端口必须在 1-65535 范围内');
    expect(validateServerNodeForm(form({ port: -1 }), HTTP).message).toBe('端口必须在 1-65535 范围内');
    expect(validateServerNodeForm(form({ port: 65536 }), HTTP).message).toBe('端口必须在 1-65535 范围内');
  });

  it('名称与列表中已存在节点冲突时拦下（编辑态排除自身 / 新增态全量校验）', () => {
    // 传入 existingNames 时同名即拦
    const r = validateServerNodeForm(form({ name: 'svc-1' }), HTTP, ['svc-1', 'svc-2']);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('已存在');
    // 不传 existingNames 则不校验名称冲突
    expect(validateServerNodeForm(form({ name: 'svc-1' }), HTTP).ok).toBe(true);
    // 传入空数组也不校验
    expect(validateServerNodeForm(form({ name: 'svc-1' }), HTTP, []).ok).toBe(true);
  });
});

describe('buildServerNodePayload', () => {
  it('名称去空白、host 缺省 0.0.0.0、enabled 原样下发', () => {
    const payload = buildServerNodePayload(form({ name: '  svc-2  ', host: '', enabled: 0 }));
    expect(payload.name).toBe('svc-2');
    expect(payload.host).toBe('0.0.0.0');
    expect(payload.enabled).toBe(0);
  });

  it('过滤器 enabled 缺省为 true，params 原样带上', () => {
    const payload = buildServerNodePayload(
      form({
        filters: [
          {
            name: 'fs',
            type: 'file-storage',
            order: 100,
            params: { layout: 'true' },
          },
        ],
      }),
    );
    expect(payload.filters?.[0]).toMatchObject({
      name: 'fs',
      type: 'file-storage',
      order: 100,
      enabled: true,
      params: { layout: 'true' },
    });
  });

  it('显式 enabled=false 的过滤器保持停用（热启停状态不被重置）', () => {
    const payload = buildServerNodePayload(
      form({
        filters: [
          { name: 'fs', type: 'file-storage', order: 100, enabled: false, params: {} },
        ],
      }),
    );
    expect(payload.filters?.[0].enabled).toBe(false);
  });

  it('协议专属 config 原样透传（代理后端、SIP token 等）', () => {
    const payload = buildServerNodePayload(
      form({ protocol: 'http-proxy', config: { backendHost: '127.0.0.1', backendPort: 8112 } }),
    );
    expect(payload.config).toEqual({ backendHost: '127.0.0.1', backendPort: 8112 });
  });
});
