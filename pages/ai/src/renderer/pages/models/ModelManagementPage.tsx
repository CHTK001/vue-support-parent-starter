/**
 * ModelManagementPage — 模型管理
 *
 * 能力覆盖：对话 / 文生图 / 文生视频 / OCR / 布局 / 人脸识别 / 图片识别 等全部管线模型。
 * 按后端管线定义，模型必填管线（requiredPipelines）与非必填管线（optionalPipelines）均属于该模型的能力集，
 * 列表中用「必填 / 非必填」胶囊标签区分。
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
} from '@arco-design/web-react';
import { Add, Box, Delete, Edit, Refresh, Search, Thunderbolt } from '@icon-park/react';
import {
  AiModelDTO,
  CAPABILITY_LABELS,
  capabilityLabel,
  DEFAULT_MANUFACTURERS,
  manufacturerApi,
  modelApi,
  pipelineApi,
  PipelineDef,
} from '@/renderer/services/api/aiConsoleApi';
import { ProviderIcon } from '@/renderer/components/common/ProviderIcon';
import { ModelLogo } from '@/renderer/components/common/ModelLogo';
import '@/renderer/styles/ai-page.css';

interface ManufacturerOption {
  id: number;
  name: string;
  code?: string;
}

export default function ModelManagementPage() {
  const { t } = useTranslation('settings');

  const [models, setModels] = useState<AiModelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState<string>('all');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [capabilityOptions, setCapabilityOptions] = useState<string[]>([]);
  const [pipelines, setPipelines] = useState<PipelineDef[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerOption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AiModelDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [form] = Form.useForm();

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const list = await modelApi.list();
      setModels(list);
    } catch (e) {
      Message.error(t('console.model.loadFailed', '模型列表加载失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadMeta = useCallback(async () => {
    try {
      const [caps, pls, mans] = await Promise.all([
        modelApi.capabilities().catch(() => ({})),
        pipelineApi.list().catch(() => [] as PipelineDef[]),
        manufacturerApi.list().catch(() => [] as ManufacturerOption[]),
      ]);
      setCapabilityOptions(Object.keys(caps).length > 0 ? Object.keys(caps) : Object.keys(CAPABILITY_LABELS));
      setPipelines(pls.filter((p) => p.kind === 'pipeline'));
      // 后端供应商为空时回退到内置默认列表（含 ollama/onnx/python/pytorch 等本地运行时）
      setManufacturers(mans.length > 0 ? mans : DEFAULT_MANUFACTURERS);
    } catch {
      /* 元数据非关键路径 */
    }
  }, []);

  useEffect(() => {
    loadModels();
    loadMeta();
  }, [loadModels, loadMeta]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return models.filter((m) => {
      if (kw && !`${m.name} ${m.code} ${m.providerName ?? ''}`.toLowerCase().includes(kw)) return false;
      if (capabilityFilter !== 'all' && !(m.capabilities ?? []).includes(capabilityFilter)) return false;
      if (pipelineFilter !== 'all') {
        const inRequired = (m.requiredPipelines ?? []).includes(pipelineFilter);
        const inOptional = (m.optionalPipelines ?? []).includes(pipelineFilter);
        const capHit = (m.capabilities ?? []).includes(pipelineFilter);
        if (!inRequired && !inOptional && !capHit) return false;
      }
      return true;
    });
  }, [models, keyword, capabilityFilter, pipelineFilter]);

  const pipelineTags = useMemo(
    () => pipelines.flatMap((p) => [...p.required.map((c) => ({ code: p.code, cap: c, required: true })), ...p.optional.map((c) => ({ code: p.code, cap: c, required: false }))]),
    [pipelines],
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      code: '',
      providerId: undefined,
      capabilities: [],
      requiredPipelines: [],
      optionalPipelines: [],
      description: '',
      enabled: true,
      sort: 0,
      inputPrice: 0,
      outputPrice: 0,
      cachePrice: 0,
      aliases: [],
    });
    setModalVisible(true);
  };

  const openEdit = (row: AiModelDTO) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      code: row.code,
      providerId: row.providerId ?? undefined,
      capabilities: row.capabilities ?? [],
      requiredPipelines: row.requiredPipelines ?? [],
      optionalPipelines: row.optionalPipelines ?? [],
      description: row.description ?? '',
      enabled: row.enabled ?? true,
      sort: row.sort ?? 0,
      inputPrice: row.inputPrice ?? 0,
      outputPrice: row.outputPrice ?? 0,
      cachePrice: row.cachePrice ?? 0,
      aliases: row.aliases ?? [],
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = (await form.validate()) as AiModelDTO;
    setSaving(true);
    try {
      if (editing?.id != null) {
        await modelApi.update(editing.id, values);
        Message.success(t('console.model.updateOk', '模型已更新'));
      } else {
        await modelApi.create(values);
        Message.success(t('console.model.createOk', '模型已创建'));
      }
      setModalVisible(false);
      loadModels();
    } catch (e) {
      Message.error(t('console.model.saveFailed', '保存失败，请检查必填项'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AiModelDTO) => {
    try {
      await modelApi.remove(row.id!);
      Message.success(t('console.model.deleteOk', '模型已删除'));
      loadModels();
    } catch {
      Message.error(t('console.model.deleteFailed', '删除失败'));
    }
  };

  const handleTestLatency = async (row: AiModelDTO) => {
    if (!row.providerId) {
      Message.warning(t('console.model.noProvider', '该模型未配置供应商，无法测试延迟'));
      return;
    }
    setTestingId(row.id!);
    try {
      const updated = await modelApi.testLatency(row.id!);
      setModels((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      Message.success(t('console.model.testLatencyOk', '延迟测试完成：{{latency}}ms', { latency: updated.lastLatency ?? '—' }));
    } catch (e: any) {
      Message.error(t('console.model.testLatencyFailed', '延迟测试失败：{{msg}}', { msg: e?.message ?? '未知错误' }));
    } finally {
      setTestingId(null);
    }
  };

  const pipelineTagForCap = (cap: string) => pipelineTags.find((x) => x.cap === cap);

  /** 模型供应商名（providerName 缺失时按 providerId 从厂商列表查名） */
  const providerNameOf = (m: AiModelDTO): string | null => {
    if (m.providerName) return m.providerName;
    if (m.providerId == null) return null;
    return manufacturers.find((p) => p.id === m.providerId)?.name ?? null;
  };

  /* ===== 批量操作 ===== */
  const selectedModels = useMemo(() => models.filter((m) => m.id != null && selectedKeys.includes(m.id)), [models, selectedKeys]);
  const allChecked = filtered.length > 0 && filtered.every((m) => m.id != null && selectedKeys.includes(m.id));
  const someChecked = filtered.some((m) => m.id != null && selectedKeys.includes(m.id));

  const toggleAll = (checked: boolean) => {
    const ids = filtered.filter((m) => m.id != null).map((m) => m.id!) as number[];
    setSelectedKeys(checked ? Array.from(new Set([...selectedKeys, ...ids])) : selectedKeys.filter((k) => !ids.includes(k)));
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedKeys((prev) => (checked ? [...prev, id] : prev.filter((k) => k !== id)));
  };

  const handleBatchSetEnabled = async (enabled: boolean) => {
    setBatchLoading(true);
    let ok = 0;
    for (const m of selectedModels) {
      try {
        await modelApi.update(m.id!, { ...m, enabled });
        ok += 1;
      } catch {
        /* 单个失败不中断批量 */
      }
    }
    setBatchLoading(false);
    setSelectedKeys([]);
    Message.success(t('console.model.batchSetOk', '已{{action}} {{count}} 个模型', { action: enabled ? '启用' : '停用', count: ok }));
    loadModels();
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    let ok = 0;
    for (const m of selectedModels) {
      try {
        await modelApi.remove(m.id!);
        ok += 1;
      } catch {
        /* 单个失败不中断批量 */
      }
    }
    setBatchLoading(false);
    setSelectedKeys([]);
    Message.success(t('console.model.batchDeleteOk', '已删除 {{count}} 个模型', { count: ok }));
    loadModels();
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <Box theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.model.title', '模型管理')}</h1>
          <p className="desc">{t('console.model.desc', '维护全部 AI 模型：对话、文生图、文生视频、OCR、布局、人脸识别、图片识别等管线模型')}</p>
        </div>
      </div>

      <div className="ai-toolbar" style={{ marginTop: 18 }}>
        <Input
          className="search-box"
          prefix={<Search size={14} />}
          allowClear
          placeholder={t('console.model.searchPlaceholder', '搜索模型名称 / 标识 / 供应商')}
          value={keyword}
          onChange={(v) => setKeyword(v)}
        />
        <div className="ai-pills" role="group" aria-label={t('console.model.capabilityFilter', '能力筛选')}>
          <button type="button" aria-pressed={capabilityFilter === 'all'} className={capabilityFilter === 'all' ? 'selected' : ''} onClick={() => setCapabilityFilter('all')}>
            {t('console.model.all', '全部')}
          </button>
          {capabilityOptions.slice(0, 10).map((c) => (
            <button key={c} type="button" aria-pressed={capabilityFilter === c} className={capabilityFilter === c ? 'selected' : ''} onClick={() => setCapabilityFilter(c)}>
              {capabilityLabel(c)}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<Add size={14} />} onClick={openCreate}>
          {t('console.model.create', '新建模型')}
        </Button>
        <Button icon={<Refresh size={14} />} onClick={loadModels} />
      </div>

      <div className="ai-toolbar" style={{ marginTop: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)' }}>{t('console.model.pipelineFilter', '管线')}</span>
        <div className="ai-pills" role="group">
          <button type="button" aria-pressed={pipelineFilter === 'all'} className={pipelineFilter === 'all' ? 'selected' : ''} onClick={() => setPipelineFilter('all')}>
            {t('console.model.allPipelines', '全部管线')}
          </button>
          {pipelines.map((p) => (
            <button key={p.code} type="button" aria-pressed={pipelineFilter === p.code} className={pipelineFilter === p.code ? 'selected' : ''} onClick={() => setPipelineFilter(p.code)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {selectedKeys.length > 0 && (
        <div className="ai-toolbar" style={{ marginTop: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-2, #5c5c66)', fontWeight: 600 }}>
            {t('console.model.selectedCount', '已选 {{count}} 项', { count: selectedKeys.length })}
          </span>
          <Button size="small" type="primary" loading={batchLoading} onClick={() => handleBatchSetEnabled(true)}>
            {t('console.model.batchEnable', '批量启用')}
          </Button>
          <Button size="small" loading={batchLoading} onClick={() => handleBatchSetEnabled(false)}>
            {t('console.model.batchDisable', '批量停用')}
          </Button>
          <Popconfirm title={t('console.model.batchConfirmDelete', '确认删除选中的 {{count}} 个模型？', { count: selectedKeys.length })} onOk={handleBatchDelete}>
            <Button size="small" status="danger" loading={batchLoading}>
              {t('console.model.batchDelete', '批量删除')}
            </Button>
          </Popconfirm>
          <Button size="small" type="text" onClick={() => setSelectedKeys([])}>
            {t('console.model.clearSelection', '取消选择')}
          </Button>
        </div>
      )}

      <div className="ai-table md:ai-table md:md-card" style={{ marginTop: 14, ['--ai-grid-cols' as string]: '32px minmax(200px, 2fr) minmax(180px, 1.6fr) minmax(120px, 1fr) minmax(120px, 1fr) 110px 130px 160px' }}>
        <div className="table-head hidden md:grid">
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox checked={allChecked} indeterminate={!allChecked && someChecked} onChange={toggleAll} />
          </span>
          <span>{t('console.model.colName', '模型')}</span>
          <span>{t('console.model.colCapabilities', '能力 / 管线')}</span>
          <span>{t('console.model.colProvider', '供应商')}</span>
          <span>{t('console.model.colPrice', '价格 (¥/1k)')}</span>
          <span>{t('console.model.colStatus', '状态')}</span>
          <span>{t('console.model.colLatency', '延迟')}</span>
          <span style={{ textAlign: 'right' }}>{t('console.model.colActions', '操作')}</span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="ai-empty">
            <span className="icon">
              <Box size={26} />
            </span>
            <span className="title">{t('console.model.emptyTitle', '暂无模型')}</span>
            <span className="hint">{t('console.model.emptyHint', '点击右上角「新建模型」添加第一个模型')}</span>
          </div>
        ) : (
          filtered.map((m) => (
            <div className="table-row" key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox checked={m.id != null && selectedKeys.includes(m.id)} onChange={(c) => m.id != null && toggleOne(m.id, c)} />
              </div>
              <div className="md:hidden" style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)', fontFamily: 'monospace' }}>{m.code}</span>
              </div>
              <div style={{ display: 'none' }} className="md:block">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <ModelLogo model={m.name} vendor={providerNameOf(m)} size={14} />
                  <span>{m.name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)', fontFamily: 'monospace' }}>{m.code}</div>
                {(m.aliases ?? []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {(m.aliases ?? []).slice(0, 3).map((a) => (
                      <span key={a} className="ai-model-chip" style={{ background: 'var(--color-fill-2, #f2f3f5)', color: 'var(--color-text-3, #9a9aa5)', fontSize: 11 }}>
                        {a}
                      </span>
                    ))}
                    {(m.aliases ?? []).length > 3 && (
                      <span className="ai-model-chip" style={{ background: 'var(--color-fill-2, #f2f3f5)', color: 'var(--color-text-3, #9a9aa5)', fontSize: 11 }}>
                        +{(m.aliases ?? []).length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(m.capabilities ?? []).slice(0, 6).map((c) => {
                  const pt = pipelineTagForCap(c);
                  return (
                    <span key={c} className={`ai-model-chip${pt ? (pt.required ? ' required' : ' optional') : ''}`}>
                      {capabilityLabel(c)}
                    </span>
                  );
                })}
                {(m.capabilities ?? []).length > 6 && (
                  <span className="ai-model-chip">+{(m.capabilities ?? []).length - 6}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-2, #5c5c66)' }}>
                <ProviderIcon provider={providerNameOf(m)} size={14} />
                {providerNameOf(m) ?? '—'}
              </div>
              <div>
                {m.inputPrice != null || m.outputPrice != null ? (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {m.inputPrice ?? 0} / {m.outputPrice ?? 0}
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-4, #b4b4be)' }}>—</span>
                )}
              </div>
              <div>
                {m.enabled ? (
                  <span className="ai-badge ai-badge-success">
                    <span className="dot" />
                    {t('console.model.enabled', '启用')}
                  </span>
                ) : (
                  <span className="ai-badge ai-badge-neutral">
                    <span className="dot" />
                    {t('console.model.disabled', '停用')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {m.lastLatency != null ? (
                  <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: m.lastLatency < 1000 ? '#00b42a' : m.lastLatency < 3000 ? '#ff7d00' : '#f53f3f' }}>
                    {m.lastLatency < 1000 ? `${m.lastLatency}ms` : `${(m.lastLatency / 1000).toFixed(2)}s`}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--color-text-4, #b4b4be)' }}>—</span>
                )}
                {m.lastTestTime && (
                  <span style={{ fontSize: 10, color: 'var(--color-text-4, #b4b4be)' }}>{m.lastTestTime}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <Button
                  size="small"
                  icon={<Thunderbolt size={13} />}
                  loading={testingId === m.id}
                  disabled={testingId === m.id}
                  onClick={() => handleTestLatency(m)}
                  aria-label={t('console.model.testLatency', '测试延迟')}
                  title={t('console.model.testLatency', '测试延迟')}
                />
                <Button size="small" icon={<Edit size={13} />} onClick={() => openEdit(m)} aria-label={t('console.model.edit', '编辑')} />
                <Popconfirm title={t('console.model.confirmDelete', '确认删除该模型？')} onOk={() => handleDelete(m)}>
                  <Button size="small" status="danger" icon={<Delete size={13} />} aria-label={t('console.model.delete', '删除')} />
                </Popconfirm>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        title={editing ? t('console.model.editTitle', '编辑模型') : t('console.model.createTitle', '新建模型')}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        confirmLoading={saving}
        unmountOnExit
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.model.formName', '模型名称')} field="name" rules={[{ required: true, message: t('console.model.required', '必填') }]}>
              <Input placeholder="gpt-4o" />
            </Form.Item>
            <Form.Item label={t('console.model.formCode', '模型标识')} field="code" rules={[{ required: true, message: t('console.model.required', '必填') }]}>
              <Input placeholder="deepseek-chat" />
            </Form.Item>
          </div>
          <Form.Item label={t('console.model.formProvider', '供应商')} field="providerId">
            <Select
              allowClear
              showSearch
              getPopupContainer={(node) => node.parentNode as HTMLElement}
              placeholder={t('console.model.formProviderPlaceholder', '选择供应商（可留空）')}
            >
              {manufacturers.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <ProviderIcon provider={m.code ?? m.name} size={14} />
                    {m.name}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={t('console.model.formCapabilities', '能力标签')} field="capabilities" extra={t('console.model.formCapabilitiesExtra', '覆盖对话 / 文生图 / 文生视频 / OCR / 布局 / 人脸识别 / 图片识别等全部能力')}>
            <Select mode="multiple" allowCreate getPopupContainer={(node) => node.parentNode as HTMLElement} placeholder={t('console.model.formCapabilitiesPlaceholder', '选择或输入能力标签')}>
              {capabilityOptions.map((c) => (
                <Select.Option key={c} value={c}>
                  {capabilityLabel(c)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={t('console.model.formAliases', '模型别名')} field="aliases" extra={t('console.model.formAliasesExtra', '请求时别名自动映射到主模型，如 gpt-4-turbo / gpt4')}>
            <Select mode="multiple" allowCreate getPopupContainer={(node) => node.parentNode as HTMLElement} placeholder={t('console.model.formAliasesPlaceholder', '输入别名后回车添加')} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.model.formRequired', '必填管线')} field="requiredPipelines">
              <Select mode="multiple" getPopupContainer={(node) => node.parentNode as HTMLElement} placeholder={t('console.model.formRequiredPlaceholder', '属于哪些管线的必填部分')}>
                {pipelineTags.filter((x) => x.required).map((x) => (
                  <Select.Option key={x.cap} value={x.cap}>
                    {x.cap}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={t('console.model.formOptional', '非必填管线')} field="optionalPipelines">
              <Select mode="multiple" getPopupContainer={(node) => node.parentNode as HTMLElement} placeholder={t('console.model.formOptionalPlaceholder', '属于哪些管线的可选部分')}>
                {pipelineTags.filter((x) => !x.required).map((x) => (
                  <Select.Option key={x.cap} value={x.cap}>
                    {x.cap}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item label={t('console.model.formDescription', '描述')} field="description">
            <Input.TextArea rows={2} placeholder={t('console.model.formDescriptionPlaceholder', '模型能力 / 用途说明')} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.model.formInputPrice', '输入单价')} field="inputPrice">
              <InputNumber min={0} precision={4} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('console.model.formOutputPrice', '输出单价')} field="outputPrice">
              <InputNumber min={0} precision={4} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('console.model.formCachePrice', '缓存单价')} field="cachePrice">
              <InputNumber min={0} precision={4} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Form.Item label={t('console.model.formEnabled', '启用')} field="enabled" triggerPropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
            <Form.Item label={t('console.model.formSort', '排序')} field="sort" style={{ marginBottom: 0 }}>
              <InputNumber min={0} style={{ width: 120 }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
