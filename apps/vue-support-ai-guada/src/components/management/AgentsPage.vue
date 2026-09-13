<template>
  <GenericManagementPage
    title="Agent管理"
    description="管理Agent配置，支持主从编排和子Agent配置"
    :columns="columns"
    :form-fields="formFields"
    :api="agentApi"
    id-field="id"
    name-field="name"
  >
    <template #row-actions="{ row }">
      <el-button type="warning" link @click="handleConfig(row)">配置</el-button>
    </template>
  </GenericManagementPage>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import GenericManagementPage from './GenericManagementPage.vue';
import { agentApi } from '@/services/javaApi';

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: 'Agent名称', minWidth: 150 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'model', label: '绑定模型', minWidth: 150 },
  {
    prop: 'type',
    label: '类型',
    width: 120,
    formatter: (row: any) => row.type === 'master' ? '主Agent' : '子Agent',
  },
  {
    prop: 'enabled',
    label: '状态',
    width: 100,
    formatter: (row: any) => row.enabled ? '启用' : '禁用',
  },
];

const formFields = [
  { prop: 'name', label: 'Agent名称', type: 'input' as const, placeholder: '请输入Agent名称' },
  { prop: 'description', label: '描述', type: 'textarea' as const, rows: 2 },
  { prop: 'model', label: '绑定模型', type: 'input' as const, placeholder: '请输入模型名称' },
  {
    prop: 'type',
    label: 'Agent类型',
    type: 'select' as const,
    options: [
      { label: '主Agent', value: 'master' },
      { label: '子Agent', value: 'sub' },
    ],
  },
  { prop: 'systemPrompt', label: '系统提示词', type: 'textarea' as const, rows: 3 },
  { prop: 'subAgents', label: '子Agent配置', type: 'textarea' as const, rows: 3, placeholder: 'JSON格式配置子Agent' },
  { prop: 'enabled', label: '启用', type: 'switch' as const },
];

function handleConfig(row: any) {
  ElMessage.info(`配置Agent: ${row.name}（工作流配置功能开发中）`);
}
</script>
