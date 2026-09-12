/**
 * McpManagementPage — MCP 服务器管理
 *
 * 功能：MCP 服务器列表（Card）、连接状态标签、新建/编辑表单（stdio / sse）、
 * 测试连接、启用开关、删除。
 * 后端：/api/mcp/servers、/api/mcp/servers/{id}、/api/mcp/servers/{id}/toggle、/api/mcp/test-connection
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Tag,
} from '@arco-design/web-react';
import { Add, Connect, Delete, Edit, LinkTwo, Refresh } from '@icon-park/react';
import {
  McpServer,
  McpTransport,
  mcpApi,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const iconProps = { theme: 'outline' as const, size: 16, strokeWidth: 4, fill: 'currentColor' as const };

interface McpFormState {
  name: string;
  transportType: 'stdio' | 'sse' | 'http';
  command: string;
  args: string;
  env: string;
  url: string;
  enabled: boolean;
}

const EMPTY_FORM: McpFormState = {
  name: '',
  transportType: 'stdio',
  command: '',
  args: '',
  env: '',
  url: '',
  enabled: true,
};

export default function McpManagementPage() {
  const { t } = useTranslation('settings');

  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<McpServer | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadServers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await mcpApi.list();
      setServers(list ?? []);
    } catch {
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const buildTransport = (values: McpFormState): McpTransport => {
    if (values.transportType === 'stdio') {
      return {
        type: 'stdio',
        command: values.command,
        args: values.args ? values.args.split(/\s+/).filter(Boolean) : [],
        env: values.env
          ? values.env
              .split(/\n/)
              .map((line) => line.trim())
              .filter(Boolean)
              .reduce<Record<string, string>>((acc, line) => {
                const idx = line.indexOf('=');
                if (idx > 0) acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
                return acc;
              }, {})
          : {},
      };
    }
    return { type: values.transportType, url: values.url };
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (row: McpServer) => {
    setEditing(row);
    const tr = row.transport ?? { type: 'stdio' };
    form.setFieldsValue({
      name: row.name,
      transportType: tr.type ?? 'stdio',
      command: tr.command ?? '',
      args: (tr.args ?? []).join(' '),
      env: Object.entries(tr.env ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
      url: tr.url ?? '',
      enabled: row.enabled,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const values = (await form.validate()) as McpFormState;
    setSaving(true);
    try {
      const transport = buildTransport(values);
      if (editing) {
        await mcpApi.update(editing.mcp_server_id, { name: values.name, transport, enabled: values.enabled });
        Message.success(t('console.mcp.updateOk', 'MCP 服务器已更新'));
      } else {
        await mcpApi.create({ name: values.name, transport, enabled: values.enabled });
        Message.success(t('console.mcp.createOk', 'MCP 服务器已创建'));
      }
      setModalVisible(false);
      loadServers();
    } catch {
      Message.error(t('console.mcp.saveFailed', '保存失败，请检查必填项'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: McpServer) => {
    try {
      await mcpApi.remove(row.mcp_server_id);
      Message.success(t('console.mcp.deleteOk', '已删除'));
      loadServers();
    } catch {
      Message.error(t('console.mcp.deleteFailed', '删除失败'));
    }
  };

  const handleToggle = async (row: McpServer) => {
    setTogglingId(row.mcp_server_id);
    try {
      await mcpApi.toggle(row.mcp_server_id);
      setServers((prev) => prev.map((s) => (s.mcp_server_id === row.mcp_server_id ? { ...s, enabled: !s.enabled } : s)));
    } catch {
      Message.error(t('console.mcp.toggleFailed', '切换状态失败'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleTest = async (row: McpServer) => {
    setTestingId(row.mcp_server_id);
    try {
      const res = await mcpApi.testConnection({ name: row.name, transport: row.transport });
      if (res.status === 'ok' || res.status === 'success') {
        Message.success(t('console.mcp.testOk', '连接成功：{{msg}}', { msg: res.message ?? `${(res.tools ?? []).length} 个工具` }));
      } else {
        Message.warning(t('console.mcp.testWarn', '连接状态：{{status}}', { status: res.status }));
      }
      setServers((prev) => prev.map((s) => (s.mcp_server_id === row.mcp_server_id ? { ...s, last_test_status: res.status } : s)));
    } catch (e: any) {
      Message.error(t('console.mcp.testFailed', '连接测试失败：{{msg}}', { msg: e?.message ?? '' }));
    } finally {
      setTestingId(null);
    }
  };

  const transportType = form?.getFieldValue?.('transportType');

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <LinkTwo theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.mcp.title', 'MCP 服务器')}</h1>
          <p className="desc">{t('console.mcp.desc', '管理 Model Context Protocol 服务器：stdio / SSE 传输、连接测试与启停')}</p>
        </div>
        <div className="ai-page-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<Add size={14} />} onClick={openCreate}>
            {t('console.mcp.create', '新建服务器')}
          </Button>
          <Button icon={<Refresh size={14} />} onClick={loadServers} />
        </div>
      </div>

      <Spin loading={loading} style={{ display: 'block', marginTop: 16 }}>
        {servers.length === 0 ? (
          <Empty description={t('console.mcp.empty', '暂无 MCP 服务器，点击右上角新建')} />
        ) : (
          <div className="ai-service-list">
            {servers.map((svr) => (
              <Card key={svr.mcp_server_id} className="ai-service-card" hoverable>
                <div className="ai-service-card-header">
                  <div className="ai-service-card-title">
                    <LinkTwo {...iconProps} />
                    <span>{svr.name}</span>
                    {svr.enabled ? (
                      <Tag color="green" size="small">
                        <span className="ai-status-dot ai-status-dot-running" />
                        {t('console.mcp.enabled', '已启用')}
                      </Tag>
                    ) : (
                      <Tag color="gray" size="small">
                        <span className="ai-status-dot" />
                        {t('console.mcp.disabled', '已停用')}
                      </Tag>
                    )}
                    {svr.builtin && <Tag size="small">{t('console.mcp.builtin', '内置')}</Tag>}
                    {svr.last_test_status && (
                      <Tag color={svr.last_test_status === 'ok' || svr.last_test_status === 'success' ? 'green' : 'red'} size="small">
                        {t('console.mcp.testStatus', '测试：{{status}}', { status: svr.last_test_status })}
                      </Tag>
                    )}
                  </div>
                  <div className="ai-service-card-actions">
                    <Button
                      size="small"
                      icon={<Connect size={13} />}
                      loading={testingId === svr.mcp_server_id}
                      disabled={testingId === svr.mcp_server_id}
                      onClick={() => handleTest(svr)}
                    >
                      {t('console.mcp.test', '测试连接')}
                    </Button>
                    <Button size="small" icon={<Edit size={13} />} onClick={() => openEdit(svr)}>
                      {t('console.mcp.edit', '编辑')}
                    </Button>
                    <Popconfirm title={t('console.mcp.confirmDelete', '确认删除该服务器？')} onOk={() => handleDelete(svr)}>
                      <Button size="small" status="danger" icon={<Delete size={13} />}>
                        {t('console.mcp.delete', '删除')}
                      </Button>
                    </Popconfirm>
                  </div>
                </div>

                <div className="ai-service-config">
                  <div className="ai-service-config-item">
                    <span className="ai-service-config-label">{t('console.mcp.colType', '传输类型')}</span>
                    <span className="ai-service-config-value">{svr.transport?.type ?? '—'}</span>
                  </div>
                  {svr.transport?.type === 'stdio' ? (
                    <>
                      <div className="ai-service-config-item">
                        <span className="ai-service-config-label">{t('console.mcp.colCommand', '命令')}</span>
                        <span className="ai-service-config-value">{svr.transport?.command ?? '—'}</span>
                      </div>
                      <div className="ai-service-config-item">
                        <span className="ai-service-config-label">{t('console.mcp.colArgs', '参数')}</span>
                        <span className="ai-service-config-value">{(svr.transport?.args ?? []).join(' ') || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="ai-service-config-item">
                      <span className="ai-service-config-label">{t('console.mcp.colUrl', 'URL')}</span>
                      <span className="ai-service-config-value">{svr.transport?.url ?? '—'}</span>
                    </div>
                  )}
                  <div className="ai-service-config-item">
                    <span className="ai-service-config-label">{t('console.mcp.colToggle', '启用')}</span>
                    <Switch
                      size="small"
                      checked={svr.enabled}
                      loading={togglingId === svr.mcp_server_id}
                      onChange={() => handleToggle(svr)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Spin>

      <Modal
        title={editing ? t('console.mcp.editTitle', '编辑 MCP 服务器') : t('console.mcp.createTitle', '新建 MCP 服务器')}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        confirmLoading={saving}
        unmountOnExit
        style={{ width: 600 }}
        {...({} as any)}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label={t('console.mcp.formName', '名称')} field="name" rules={[{ required: true, message: t('console.mcp.required', '必填') }]}>
            <Input placeholder={t('console.mcp.namePlaceholder', '如：filesystem')} />
          </Form.Item>
          <Form.Item label={t('console.mcp.formType', '传输类型')} field="transportType">
            <Select
              getPopupContainer={(node) => node.parentNode as HTMLElement}
              options={[
                { label: 'stdio', value: 'stdio' },
                { label: 'SSE', value: 'sse' },
                { label: 'HTTP', value: 'http' },
              ]}
            />
          </Form.Item>

          {(transportType ?? 'stdio') === 'stdio' ? (
            <>
              <Form.Item label={t('console.mcp.formCommand', '命令')} field="command" rules={[{ required: true, message: t('console.mcp.required', '必填') }]}>
                <Input placeholder="npx" />
              </Form.Item>
              <Form.Item label={t('console.mcp.formArgs', '参数（空格分隔）')} field="args">
                <Input placeholder="-y @modelcontextprotocol/server-filesystem /path" />
              </Form.Item>
              <Form.Item label={t('console.mcp.formEnv', '环境变量（每行 KEY=VALUE）')} field="env">
                <Input.TextArea rows={3} placeholder="API_KEY=xxx" />
              </Form.Item>
            </>
          ) : (
            <Form.Item label={t('console.mcp.formUrl', '服务 URL')} field="url" rules={[{ required: true, message: t('console.mcp.required', '必填') }]}>
              <Input placeholder="http://localhost:3000/sse" />
            </Form.Item>
          )}

          <Form.Item label={t('console.mcp.formEnabled', '启用')} field="enabled" triggerPropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
