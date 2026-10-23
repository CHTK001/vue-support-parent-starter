<template>
  <GenericManagementPage data-page="mcp"
    title="MCP管理"
    description="管理MCP服务器配置，支持增删查改"
    :columns="columns"
    :form-fields="formFields"
    :api="mcpApi"
    id-field="id"
    name-field="name"
  />
</template>

<script setup lang="ts">
import GenericManagementPage from './GenericManagementPage.vue';
import { mcpApi } from '@/services/javaApi';

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
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
];

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
