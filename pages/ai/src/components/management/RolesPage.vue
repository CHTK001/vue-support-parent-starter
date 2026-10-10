<template>
  <GenericManagementPage
    title="角色管理"
    description="管理AI角色配置，支持增删查改"
    :columns="columns"
    :form-fields="formFields"
    :api="roleApi"
    id-field="id"
    name-field="name"
  />
</template>

<script setup lang="ts">
import GenericManagementPage from './GenericManagementPage.vue';
import { roleApi } from '@/services/javaApi';

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '角色名称', minWidth: 150 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'model', label: '绑定模型', minWidth: 150 },
  {
    prop: 'enabled',
    label: '状态',
    width: 100,
    formatter: (row: any) => row.enabled ? '启用' : '禁用',
  },
  { prop: 'createTime', label: '创建时间', width: 180 },
];

const formFields = [
  { prop: 'name', label: '角色名称', type: 'input' as const, placeholder: '请输入角色名称' },
  { prop: 'description', label: '描述', type: 'textarea' as const, rows: 3, placeholder: '请输入角色描述' },
  { prop: 'model', label: '绑定模型', type: 'input' as const, placeholder: '请输入模型名称' },
  { prop: 'systemPrompt', label: '系统提示词', type: 'textarea' as const, rows: 4, placeholder: '请输入系统提示词' },
  { prop: 'enabled', label: '启用', type: 'switch' as const },
];
</script>
