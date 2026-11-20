<template>
  <GenericManagementPage data-page="roles"
    title="角色管理"
    description="管理AI角色配置，支持增删查改"
    :columns="columns"
    :form-fields="formFields"
    :form-rules="formRules"
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
    // 后端契约字段是 status（1=启用 / 0=禁用，DB 默认 1）。
    // 2026-11-20 修复 DEF-01：此前读 row.enabled（后端从不返回该字段），状态列恒显示「禁用」。
    prop: 'status',
    label: '状态',
    width: 100,
    formatter: (row: any) => (row.status === 1 ? '启用' : '禁用'),
  },
  { prop: 'createTime', label: '创建时间', width: 180 },
  { prop: 'actions', label: '操作', width: 160 },
];

const formFields = [
  { prop: 'name', label: '角色名称', type: 'input' as const, placeholder: '请输入角色名称' },
  { prop: 'description', label: '描述', type: 'textarea' as const, rows: 3, placeholder: '请输入角色描述' },
  { prop: 'model', label: '绑定模型', type: 'input' as const, placeholder: '请输入模型名称' },
  { prop: 'systemPrompt', label: '系统提示词', type: 'textarea' as const, rows: 4, placeholder: '请输入系统提示词' },
  {
    // 开关直接绑后端的 status（1/0），不再发前端自造的 enabled（会被后端丢弃）。
    // default: 1 保持后端「新建角色默认启用」的原有效默认。
    prop: 'status',
    label: '启用',
    type: 'switch' as const,
    activeValue: 1,
    inactiveValue: 0,
    default: 1,
  },
];

// 2026-11-20 修复 DEF-02：新增/编辑角色名称必填（此前空名前后端都放行）。
const formRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
};
</script>
