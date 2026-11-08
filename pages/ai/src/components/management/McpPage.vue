<template>
  <GenericManagementPage data-page="mcp"
    title="MCP管理"
    description="管理MCP服务器配置，支持增删查改"
    :columns="columns"
    :form-fields="formFields"
    :form-rules="formRules"
    :api="api"
    id-field="id"
    name-field="name"
  />
</template>

<script setup lang="ts">
import GenericManagementPage from './GenericManagementPage.vue';
import { mcpApi } from '@/services/javaApi';

/**
 * 列表行适配：后端契约是 {@code { mcp_server_id, transport:{type,url,command}, created_at }}，
 * 页面列与表单用的是扁平字段；不在这里拉平，ID/类型/服务地址/创建时间四列会整列空白。
 */
function normalize(row: any) {
  const transport = row?.transport || {};
  return {
    id: row?.mcp_server_id || '',
    name: row?.name || '',
    type: transport.type || '',
    url: transport.url || '',
    command: transport.command || '',
    description: row?.description || '',
    enabled: row?.enabled !== false,
    createTime: row?.created_at ? new Date(row.created_at).toLocaleString('zh-CN', { hour12: false }) : '',
  };
}

/** 表单 → 后端契约：type/url/command 必须收进 transport，散着提交会被后端丢弃。 */
function toPayload(form: any) {
  const type = form?.type || 'http';
  return {
    name: form?.name || '',
    description: form?.description || '',
    enabled: !!form?.enabled,
    transport: type === 'stdio'
      ? { type: 'stdio', command: form?.command || '' }
      : { type, url: form?.url || '' },
  };
}

const api = {
  list: async (params: any) => {
    const res: any = await mcpApi.list(params);
    const rows: any[] = Array.isArray(res?.data) ? res.data : [];
    const keyword = String(params?.keyword || '').trim().toLowerCase();
    const filtered = keyword
      ? rows.filter((r) => `${r?.name || ''} ${r?.description || ''}`.toLowerCase().includes(keyword))
      : rows;
    return { success: true, data: filtered.map(normalize), total: filtered.length };
  },
  create: (data: any) => mcpApi.create(toPayload(data)),
  update: (id: string, data: any) => mcpApi.update(id, toPayload(data)),
  delete: (id: string) => mcpApi.delete(id),
};

const columns = [
  { prop: 'name', label: '名称', minWidth: 150 },
  { prop: 'type', label: '类型', width: 120 },
  { prop: 'url', label: '服务地址', minWidth: 200 },
  {
    prop: 'enabled',
    label: '状态',
    width: 100,
    formatter: (row: any) => row.enabled ? '启用' : '禁用',
  },
  { prop: 'createTime', label: '创建时间', width: 180 },
  { prop: 'actions', label: '操作', width: 120 },
];

const formRules = {
  name: [{ required: true, message: '请输入MCP名称', trigger: 'blur' }],
};

const formFields = [
  { prop: 'name', label: '名称', type: 'input' as const, placeholder: '请输入MCP名称' },
  {
    prop: 'type',
    label: '类型',
    type: 'select' as const,
    options: [
      { label: 'HTTP', value: 'http' },
      { label: 'Stdio', value: 'stdio' },
      { label: 'SSE', value: 'sse' },
    ],
  },
  { prop: 'url', label: '服务地址', type: 'input' as const, placeholder: '请输入服务地址' },
  { prop: 'command', label: '启动命令', type: 'input' as const, placeholder: 'Stdio类型时填写' },
  { prop: 'description', label: '描述', type: 'textarea' as const, rows: 2 },
  { prop: 'enabled', label: '启用', type: 'switch' as const },
];
</script>
