<template>
  <!-- STRING：模型选择器 -->
  <el-input
    v-if="item.valueType === 'STRING' && isModelField"
    :model-value="modelDisplay"
    readonly
    class="cursor-pointer"
    @click="$emit('pick-model')"
  >
    <template #prefix>
      <img v-if="logo" :src="logo" alt="" class="w-4 h-4 object-contain" />
      <OpenAI v-else class="w-4 h-4" />
    </template>
    <template #suffix>
      <el-icon class="el-icon--right"><ArrowDown /></el-icon>
    </template>
  </el-input>

  <!-- STRING：枚举下拉 -->
  <el-select v-else-if="item.valueType === 'STRING' && isEnumField"
    :model-value="value"
    @update:model-value="$emit('change', $event)"
    class="w-full">
    <el-option v-for="opt in options" :key="opt" :label="enumLabel(opt)" :value="opt" />
  </el-select>

  <!-- STRING：多行提示词 -->
  <el-input v-else-if="isPromptField"
    :model-value="value"
    type="textarea" :rows="4" maxlength="2000" show-word-limit
    @input="$emit('change', $event)" />

  <!-- STRING：普通文本 -->
  <el-input v-else-if="item.valueType === 'STRING'"
    :model-value="value"
    @input="$emit('change', $event)" />

  <!-- NUMBER -->
  <ReNumberInput v-else-if="item.valueType === 'NUMBER'"
    :model-value="Number(value)"
    @change="(val: any) => $emit('change', val)"
    :step="step" :precision="precision" />

  <!-- BOOLEAN -->
  <el-switch v-else-if="item.valueType === 'BOOLEAN'"
    :model-value="value === 'true'"
    @update:model-value="$emit('change', $event ? 'true' : 'false')" />

  <!-- 未知类型：兜底文本输入 -->
  <el-input v-else :model-value="value" @input="$emit('change', $event)" />
</template>

<script setup lang="ts">
/**
 * 配置字段控件发射器：按后端定义渲染 model / enum / text / number / boolean / prompt。
 * 纯展示组件：不持有状态，全部由父级托管。是「彻底重构 + 组件化」的单元之一。
 */
import { OpenAI } from "@/components/icons"
import { ArrowDown } from "@element-plus/icons-vue"
import ReNumberInput from '@/components/re/ReNumberInput.vue'

/**
 * 枚举 key → 中文标签。
 *
 * 后端把可选值写在描述括号里，如「匹配模式（strict 严谨 / loose 宽松）」，
 * 前端 parseEnumOptions 只取空格前的部分作为**值**（strict / loose），直接拿来当
 * label 就会把英文 key 显示给用户。这里给这类「值是英文但含义不直观」的项补中文；
 * 未登记的选项原样显示，避免把用户本来认识的取值（模型名、provider）翻错。
 */
const ENUM_LABELS: Record<string, string> = {
  strict: '严谨',
  loose: '宽松',
  whole: '整卷',
  region: '按版面区域分块',
}

/** 取枚举选项的显示文本 */
const enumLabel = (opt: string) => ENUM_LABELS[opt] ?? opt

const props = defineProps<{
  item: any
  /** 当前值（字符串形态） */
  value: any
  /** 是否模型字段（只读 + 点击弹模型选择） */
  isModelField: boolean
  /** 是否枚举字段 */
  isEnumField: boolean
  /** 是否多行提示词（textarea） */
  isPromptField: boolean
  /** 当前字段已选模型的 logo */
  logo?: string
  /** 模型字段的展示文本（已配置/继承全局/请选择模型） */
  modelDisplay?: string
  /** 枚举选项 */
  options?: string[]
  /** 数值步长 */
  step?: number
  /** 数值精度（小数位） */
  precision?: number
}>()

defineEmits<{
  change: [value: any]
  'pick-model': []
}>()
</script>
