/**
 * ConnectorsConfigPage — 连接器配置
 *
 * 六路来源（内置 SPI / 自定义 HTTP / 技能 / MCP / 插件 / 机器人）聚合成一份清单，
 * 按 category 分组渲染开关；自定义连接器支持增删改与连通性测试。
 * 后端：/v2/connectors-config、/api/connectors/custom
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
} from '@arco-design/web-react';
import { Add, Connect, Delete, Edit, Refresh } from '@icon-park/react';
import ConnectorIcon from '@/renderer/components/common/ConnectorIcon';
import {
  ConnectorEndpoint,
  ConnectorItem,
  ConnectorSource,
  ConnectorsConfigResponse,
  CustomConnectorPayload,
  connectorApi,
  connectorsConfigApi,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

/** 来源过滤项：值对应连接器契约的 source 字段 */
const SOURCE_FILTERS: Array<{ value: ConnectorSource | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'builtin', label: '内置' },
  { value: 'custom', label: '自定义' },
  { value: 'skill', label: '技能' },
  { value: 'mcp', label: 'MCP' },
  { value: 'plugin', label: '插件' },
  { value: 'bot', label: '机器人' },
];

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface CustomFormState {
  name: string;
  key: string;
  description: string;
  category: string;
  icon: string;
  method: string;
  url: string;
  headers: string;
  query: string;
  body: string;
  contentType: 'json' | 'form';
  resultPath: string;
  enabled: boolean;
}

const EMPTY_FORM: CustomFormState = {
  name: '',
  key: '',
  description: '',
  category: '自定义',
  icon: 'LinkTwo',
  method: 'GET',
  url: '',
  headers: '',
  query: '',
  body: '',
  contentType: 'json',
  resultPath: '',
  enabled: true,
};

/** 占位符：与后端 CustomHttpConnectorExecutor 的 ${name} 语法保持一致 */
const PLACEHOLDER = /\$\{([a-zA-Z0-9_.-]+)}/g;

/**
 * 把「每行 k: v」的文本解析成映射，忽略空行与没有分隔符的行。
 */
function parseLines(raw: string, separator: string): Record<string, string> {
  const result: Record<string, string> = {};
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf(separator);
      if (idx > 0) {
        result[line.slice(0, idx).trim()] = line.slice(idx + separator.length).trim();
      }
    });
  return result;
}

/**
 * 把映射还原成「每行 k: v」文本，供表单回填。
 */
function stringifyLines(map: Record<string, string> | undefined, separator: string): string {
  return Object.entries(map ?? {})
    .map(([k, v]) => `${k}${separator}${v}`)
    .join('\n');
}

/**
 * 把端点里的请求正文还原成表单文本。
 *
 * form 正文保存时被解析成键值映射，回填必须还原成「每行 k=v」，
 * 否则编辑再保存会把 JSON 文本当表单行解析而丢掉正文。
 */
function bodyText(endpoint: ConnectorEndpoint): string {
  const body = endpoint.body;
  if (typeof body === 'string') {
    return body;
  }
  if (body == null || body === '') {
    return '';
  }
  if (endpoint.contentType === 'form') {
    return stringifyLines(body as Record<string, string>, '=');
  }
  return JSON.stringify(body, null, 2);
}

/**
 * 从端点定义里收集 ${占位符}，自动推导连接器的入参声明。
 *
 * 自定义连接器的入参就是 URL/查询/头部/正文里的占位符，让用户再手填一遍入参表
 * 只会两处不一致。声明为非必填，连通性测试才能在空入参下跑起来。
 */
function deriveParams(endpoint: ConnectorEndpoint): Array<{ name: string; label: string; type: string; required: boolean }> {
  const names: string[] = [];
  const scan = (text: unknown) => {
    if (typeof text !== 'string') {
      return;
    }
    for (const match of text.matchAll(PLACEHOLDER)) {
      if (!names.includes(match[1])) {
        names.push(match[1]);
      }
    }
  };
  scan(endpoint.url);
  Object.values(endpoint.query ?? {}).forEach(scan);
  Object.values(endpoint.headers ?? {}).forEach(scan);
  scan(endpoint.body);
  return names.map((name) => ({ name, label: name, type: 'string', required: false }));
}

export default function ConnectorsConfigPage() {
  const { t } = useTranslation('settings');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConnectorsConfigResponse | null>(null);
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState<ConnectorSource | 'all'>('all');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<ConnectorItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await connectorsConfigApi.list());
    } catch {
      Message.error(t('console.connectorConfig.loadFailed', '连接器配置加载失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const connectors = data?.connectors ?? [];

  /** 过滤后的连接器按 category 分组，分组顺序沿用后端返回的 categories */
  const grouped = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = connectors.filter((c) => {
      if (source !== 'all' && c.source !== source) {
        return false;
      }
      if (!kw) {
        return true;
      }
      return [c.key, c.name, c.description, c.category, c.type].some((v) => (v ?? '').toLowerCase().includes(kw));
    });
    const buckets = new Map<string, ConnectorItem[]>();
    filtered.forEach((c) => {
      const category = c.category || t('console.connectorConfig.otherCategory', '其他');
      const list = buckets.get(category);
      if (list) {
        list.push(c);
      } else {
        buckets.set(category, [c]);
      }
    });
    const known = (data?.categories ?? []).filter((name) => buckets.has(name));
    const extra = [...buckets.keys()].filter((name) => !known.includes(name));
    return [...known, ...extra].map((name) => ({ name, items: buckets.get(name) ?? [] }));
  }, [connectors, keyword, source, data?.categories, t]);

  const handleToggle = async (item: ConnectorItem, enabled: boolean) => {
    setSavingKey(item.key);
    try {
      const resp = await connectorsConfigApi.update({ [item.key]: enabled });
      setData(resp);
    } catch {
      Message.error(t('console.connectorConfig.saveFailed', '保存失败'));
    } finally {
      setSavingKey(null);
    }
  };

  const handlePrivateNetwork = async (allow: boolean) => {
    try {
      const resp = await connectorsConfigApi.updatePrivateNetwork(allow);
      setData((prev) => (prev ? { ...prev, allowPrivateNetwork: resp.allowPrivateNetwork } : prev));
      Message.success(t('console.connectorConfig.saved', '已保存'));
    } catch {
      Message.error(t('console.connectorConfig.saveFailed', '保存失败'));
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (item: ConnectorItem) => {
    setEditing(item);
    const endpoint = item.endpoint ?? ({} as ConnectorEndpoint);
    form.setFieldsValue({
      ...EMPTY_FORM,
      name: item.name ?? '',
      key: item.key,
      description: item.description ?? '',
      category: item.category ?? EMPTY_FORM.category,
      icon: item.icon ?? EMPTY_FORM.icon,
      method: endpoint.method ?? 'GET',
      url: endpoint.url ?? '',
      headers: stringifyLines(endpoint.headers, ': '),
      query: stringifyLines(endpoint.query, '='),
      body: bodyText(endpoint),
      contentType: endpoint.contentType ?? 'json',
      resultPath: endpoint.resultPath ?? '',
      enabled: item.enabled ?? true,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = (await form.validate()) as CustomFormState;
    const endpoint: ConnectorEndpoint = {
      url: values.url.trim(),
      method: values.method,
      headers: parseLines(values.headers, ':'),
      query: parseLines(values.query, '='),
      contentType: values.contentType,
      resultPath: values.resultPath.trim() || undefined,
    };
    const body = values.body.trim();
    if (body) {
      if (values.contentType === 'json') {
        try {
          endpoint.body = JSON.parse(body);
        } catch {
          // 正文含 ${占位符} 时不是合法 JSON，按原样交给后端做结构级渲染
          endpoint.body = body;
        }
      } else {
        endpoint.body = parseLines(values.body, '=');
      }
    }
    const payload: CustomConnectorPayload = {
      name: values.name.trim(),
      description: values.description.trim(),
      category: values.category.trim() || '自定义',
      icon: values.icon.trim() || 'LinkTwo',
      endpoint,
      params: deriveParams(endpoint),
      enabled: values.enabled,
    };
    setSubmitting(true);
    try {
      if (editing?.connectorId) {
        await connectorApi.updateCustom(editing.connectorId, payload);
        Message.success(t('console.connectorConfig.updateOk', '连接器已更新'));
      } else {
        await connectorApi.createCustom({ ...payload, key: values.key.trim() || undefined });
        Message.success(t('console.connectorConfig.createOk', '连接器已创建'));
      }
      setModalVisible(false);
      load();
    } catch {
      Message.error(t('console.connectorConfig.saveFailed', '保存失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ConnectorItem) => {
    if (!item.connectorId) {
      return;
    }
    try {
      await connectorApi.deleteCustom(item.connectorId);
      Message.success(t('console.connectorConfig.deleteOk', '已删除'));
      load();
    } catch {
      Message.error(t('console.connectorConfig.deleteFailed', '删除失败'));
    }
  };

  const handleTest = async (item: ConnectorItem) => {
    if (!item.connectorId) {
      return;
    }
    setTestingId(item.connectorId);
    try {
      const result = await connectorApi.testCustom(item.connectorId);
      if (result.success) {
        Message.success(t('console.connectorConfig.testOk', '连通正常：{{title}}', { title: result.title ?? '' }));
      } else {
        Message.warning(t('console.connectorConfig.testFail', '连通失败：{{msg}}', { msg: result.errorMessage ?? '' }));
      }
      load();
    } catch {
      Message.error(t('console.connectorConfig.testError', '连通性测试出错'));
    } finally {
      setTestingId(null);
    }
  };

  const renderCard = (item: ConnectorItem) => {
    const dependencyMissing = item.enabled === true && item.available === false;
    return (
      <div key={item.key} className="ai-card ai-skills-provider-card">
        <div className="ai-skills-provider-info">
          <span className="ai-skills-provider-icon">
            <ConnectorIcon name={item.icon} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="ai-skills-provider-name">{item.name}</div>
            {item.description ? (
              <div className="ai-section-hint" style={{ marginBottom: 4 }}>
                {item.description}
              </div>
            ) : null}
            <div className="ai-skills-provider-meta">
              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{item.key}</span>
              <span className="ai-skills-provider-tag">{item.type}</span>
              {!item.invocable ? (
                <span className="ai-skills-provider-tag">{t('console.connectorConfig.mountOnly', '仅挂载')}</span>
              ) : null}
              {dependencyMissing ? (
                <span className="ai-skills-provider-tag" style={{ color: 'var(--color-warning, #ff7d00)' }}>
                  {t('console.connectorConfig.dependencyMissing', '依赖缺失')}
                </span>
              ) : null}
              {item.source === 'custom' ? (
                <>
                  <Button size="mini" type="text" icon={<Edit size={12} />} onClick={() => openEdit(item)} />
                  <Button
                    size="mini"
                    type="text"
                    loading={testingId === item.connectorId}
                    icon={<Connect size={12} />}
                    onClick={() => handleTest(item)}
                  />
                  <Popconfirm
                    title={t('console.connectorConfig.deleteConfirm', '确认删除该连接器？')}
                    onOk={() => handleDelete(item)}
                  >
                    <Button size="mini" type="text" status="danger" icon={<Delete size={12} />} />
                  </Popconfirm>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <Switch
          checked={item.enabled === true}
          loading={savingKey === item.key}
          disabled={savingKey === item.key}
          onChange={(checked) => handleToggle(item, checked)}
        />
      </div>
    );
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <Connect theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.connectorConfig.title', '连接器配置')}</h1>
          <p className="desc">
            {t('console.connectorConfig.desc', '内置数据/工具、技能、MCP、插件与机器人的统一开关——开启的连接器才能在会话中选用')}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<Add size={14} />} onClick={openCreate}>
            {t('console.connectorConfig.create', '添加自定义连接器')}
          </Button>
          <Button icon={<Refresh size={14} />} onClick={load} />
        </div>
      </div>

      <div className="ai-toolbar" style={{ marginTop: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('console.connectorConfig.searchPlaceholder', '搜索名称 / key / 描述')}
          value={keyword}
          onChange={setKeyword}
          style={{ width: 260 }}
        />
        <div className="ai-pills">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={source === f.value}
              onClick={() => setSource(f.value)}
            >
              {f.label}
              {f.value === 'all' ? ` ${connectors.length}` : ` ${connectors.filter((c) => c.source === f.value).length}`}
            </button>
          ))}
        </div>
        <span className="ai-section-hint" style={{ marginLeft: 'auto' }}>
          {t('console.connectorConfig.enabledStat', '已开启 {{enabled}} / {{total}}', {
            enabled: data?.enabledCount ?? 0,
            total: data?.total ?? 0,
          })}
        </span>
      </div>

      <div className="ai-warn-banner mt-12px flex items-center gap-12px px-14px py-12px">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {t('console.connectorConfig.privateNetwork', '允许自定义连接器访问内网地址')}
          </div>
          <div className="ai-section-hint">
            {t(
              'console.connectorConfig.privateNetworkHint',
              '默认拦截回环 / 链路本地 / 站点本地地址与云元数据地址，防止占位符入参把请求引向内网',
            )}
          </div>
        </div>
        <Switch checked={data?.allowPrivateNetwork === true} onChange={handlePrivateNetwork} />
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin size={28} />
        </div>
      ) : grouped.length === 0 ? (
        <div className="ai-empty" style={{ padding: 48 }}>
          <span className="title">{t('console.connectorConfig.noMatch', '没有符合条件的连接器')}</span>
        </div>
      ) : (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grouped.map((group) => (
            <section key={group.name}>
              <div className="ai-section-head">
                <h2 className="ai-section-title">
                  <ConnectorIcon name={group.items[0]?.icon} />
                  {group.name}
                  <span className="ai-section-count">{group.items.length}</span>
                </h2>
              </div>
              <div className="ai-skills-provider-grid">{group.items.map(renderCard)}</div>
            </section>
          ))}
        </div>
      )}

      <Modal
        title={
          editing
            ? t('console.connectorConfig.editTitle', '编辑自定义连接器')
            : t('console.connectorConfig.createTitle', '添加自定义连接器')
        }
        visible={modalVisible}
        confirmLoading={submitting}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        style={{ width: 640 }}
        unmountOnExit
      >
        <Form form={form} layout="vertical" initialValues={EMPTY_FORM}>
          <Form.Item
            field="name"
            label={t('console.connectorConfig.fieldName', '名称')}
            rules={[{ required: true, message: t('console.connectorConfig.nameRequired', '请输入名称') }]}
          >
            <Input placeholder={t('console.connectorConfig.namePlaceholder', '例如：内部工单查询')} />
          </Form.Item>
          {!editing ? (
            <Form.Item
              field="key"
              label={t('console.connectorConfig.fieldKey', '标识')}
              extra={t('console.connectorConfig.keyHint', '留空则由名称自动生成，形如 custom.xxx；创建后不可修改')}
            >
              <Input placeholder="custom.ticket" />
            </Form.Item>
          ) : null}
          <Form.Item field="description" label={t('console.connectorConfig.fieldDescription', '描述')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item field="category" label={t('console.connectorConfig.fieldCategory', '分组')} style={{ flex: 1 }}>
              <Input placeholder="自定义" />
            </Form.Item>
            <Form.Item
              field="icon"
              label={t('console.connectorConfig.fieldIcon', '图标')}
              style={{ flex: 1 }}
              extra={t('console.connectorConfig.iconHint', '@icon-park/react 图标名，未识别时回退为 LinkTwo')}
            >
              <Input placeholder="LinkTwo" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item field="method" label="Method" style={{ width: 140 }}>
              <Select>
                {METHODS.map((m) => (
                  <Select.Option key={m} value={m}>
                    {m}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              field="url"
              label="URL"
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('console.connectorConfig.urlRequired', '请输入请求地址') }]}
            >
              <Input placeholder="https://api.example.com/search?q=${keyword}" />
            </Form.Item>
          </div>
          <Form.Item
            field="headers"
            label={t('console.connectorConfig.fieldHeaders', '请求头')}
            extra={t('console.connectorConfig.headersHint', '每行一个，格式 Name: value，支持 ${占位符}')}
          >
            <Input.TextArea rows={2} placeholder={'Authorization: Bearer ${token}'} />
          </Form.Item>
          <Form.Item
            field="query"
            label={t('console.connectorConfig.fieldQuery', '查询参数')}
            extra={t('console.connectorConfig.queryHint', '每行一个，格式 name=value，会自动做百分号编码')}
          >
            <Input.TextArea rows={2} placeholder={'q=${keyword}'} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item field="contentType" label={t('console.connectorConfig.fieldContentType', '正文类型')} style={{ width: 140 }}>
              <Select>
                <Select.Option value="json">json</Select.Option>
                <Select.Option value="form">form</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              field="resultPath"
              label={t('console.connectorConfig.fieldResultPath', '结果路径')}
              style={{ flex: 1 }}
              extra={t('console.connectorConfig.resultPathHint', '从响应 JSON 下钻取值，例如 data.items[0].title')}
            >
              <Input placeholder="data.result" />
            </Form.Item>
          </div>
          <Form.Item field="body" label={t('console.connectorConfig.fieldBody', '请求正文')}>
            <Input.TextArea rows={4} placeholder={'{"query": "${keyword}"}'} />
          </Form.Item>
          <Form.Item field="enabled" label={t('console.connectorConfig.fieldEnabled', '创建后立即启用')} triggerPropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
