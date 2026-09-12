/**
 * RolesManagementPage — 角色管理
 *
 * 功能：角色列表（Table）、新建/编辑 Modal 表单、删除。
 * 字段：名称 / 编码 / 描述 / 系统提示词 / 默认模型 / 温度 / 排序 / 启用状态。
 * 后端：/v2/roles（GET 列表 / GET{id} / POST / PUT{id} / DELETE{id}）
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
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
  Table,
  Tag,
} from '@arco-design/web-react';
import { Add, Delete, Edit, IdCard, Refresh } from '@icon-park/react';
import { AiRole, roleApi } from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const iconProps = { theme: 'outline' as const, size: 16, strokeWidth: 4, fill: 'currentColor' as const };

export default function RolesManagementPage() {
  const { t } = useTranslation('settings');

  const [roles, setRoles] = useState<AiRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AiRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const list = await roleApi.list();
      setRoles(list ?? []);
    } catch {
      Message.error(t('console.roles.loadFailed', '角色列表加载失败'));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      code: '',
      description: '',
      systemPrompt: '',
      model: '',
      temperature: 0.7,
      sort: 0,
      status: 1,
    });
    setModalVisible(true);
  };

  const openEdit = (row: AiRole) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      code: row.code,
      description: row.description ?? '',
      systemPrompt: row.systemPrompt ?? '',
      model: row.model ?? '',
      temperature: row.temperature ?? 0.7,
      sort: row.sort ?? 0,
      status: row.status ?? 1,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = (await form.validate()) as AiRole;
    setSaving(true);
    try {
      if (editing?.id != null) {
        await roleApi.update(editing.id, values);
        Message.success(t('console.roles.updateOk', '角色已更新'));
      } else {
        await roleApi.create(values);
        Message.success(t('console.roles.createOk', '角色已创建'));
      }
      setModalVisible(false);
      loadRoles();
    } catch {
      Message.error(t('console.roles.saveFailed', '保存失败，请检查必填项'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AiRole) => {
    try {
      await roleApi.remove(row.id!);
      Message.success(t('console.roles.deleteOk', '角色已删除'));
      loadRoles();
    } catch {
      Message.error(t('console.roles.deleteFailed', '删除失败'));
    }
  };

  const columns = [
    {
      title: t('console.roles.colName', '名称'),
      dataIndex: 'name',
      render: (_: string, row: AiRole) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)', fontFamily: 'monospace' }}>{row.code}</div>
        </div>
      ),
    },
    {
      title: t('console.roles.colDesc', '描述'),
      dataIndex: 'description',
      render: (v?: string) => (
        <span style={{ color: 'var(--color-text-2, #5c5c66)' }}>{v || '—'}</span>
      ),
    },
    {
      title: t('console.roles.colModel', '默认模型'),
      dataIndex: 'model',
      render: (v?: string) =>
        v ? <Tag size="small">{v}</Tag> : <span style={{ color: 'var(--color-text-4, #b4b4be)' }}>—</span>,
    },
    {
      title: t('console.roles.colTemperature', '温度'),
      dataIndex: 'temperature',
      width: 90,
      render: (v?: number) => (v != null ? Number(v).toFixed(2) : '—'),
    },
    {
      title: t('console.roles.colSort', '排序'),
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: t('console.roles.colStatus', '状态'),
      dataIndex: 'status',
      width: 90,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green" size="small">{t('console.roles.enabled', '启用')}</Tag>
        ) : (
          <Tag size="small">{t('console.roles.disabled', '禁用')}</Tag>
        ),
    },
    {
      title: t('console.roles.colActions', '操作'),
      dataIndex: 'actions',
      width: 130,
      render: (_: unknown, row: AiRole) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="small" icon={<Edit size={13} />} onClick={() => openEdit(row)} aria-label={t('console.roles.edit', '编辑')} />
          <Popconfirm title={t('console.roles.confirmDelete', '确认删除该角色？')} onOk={() => handleDelete(row)}>
            <Button size="small" status="danger" icon={<Delete size={13} />} aria-label={t('console.roles.delete', '删除')} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <IdCard theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.roles.title', '角色管理')}</h1>
          <p className="desc">{t('console.roles.desc', '维护对话角色：系统提示词、默认模型、温度与排序')}</p>
        </div>
        <div className="ai-page-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<Add size={14} />} onClick={openCreate}>
            {t('console.roles.create', '新建角色')}
          </Button>
          <Button icon={<Refresh size={14} />} onClick={loadRoles} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          data={roles}
          noDataElement={<Empty description={t('console.roles.empty', '暂无角色')} />}
          border={false}
          stripe
        />
      </div>

      <Modal
        title={editing ? t('console.roles.editTitle', '编辑角色') : t('console.roles.createTitle', '新建角色')}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        confirmLoading={saving}
        unmountOnExit
        style={{ width: 640 }}
        {...({} as any)}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.roles.formName', '名称')} field="name" rules={[{ required: true, message: t('console.roles.required', '必填') }]}>
              <Input placeholder={t('console.roles.namePlaceholder', '如：代码助手')} />
            </Form.Item>
            <Form.Item label={t('console.roles.formCode', '编码')} field="code" rules={[{ required: true, message: t('console.roles.required', '必填') }]}>
              <Input placeholder={t('console.roles.codePlaceholder', '如：code-assistant')} />
            </Form.Item>
          </div>
          <Form.Item label={t('console.roles.formDescription', '描述')} field="description">
            <Input.TextArea rows={2} placeholder={t('console.roles.descPlaceholder', '角色用途简述')} />
          </Form.Item>
          <Form.Item label={t('console.roles.formSystemPrompt', '系统提示词')} field="systemPrompt">
            <Input.TextArea rows={5} placeholder={t('console.roles.promptPlaceholder', '定义角色行为的系统提示词')} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.roles.formModel', '默认模型')} field="model">
              <Input placeholder="如：gpt-4o" />
            </Form.Item>
            <Form.Item label={t('console.roles.formTemperature', '温度')} field="temperature">
              <InputNumber min={0} max={2} step={0.1} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('console.roles.formSort', '排序')} field="sort">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label={t('console.roles.formStatus', '启用状态')} field="status" triggerPropName="checked" getValueFromEvent={(v) => (v ? 1 : 0)}>
            <Switch checkedText={t('console.roles.enabled', '启用')} uncheckedText={t('console.roles.disabled', '禁用')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
