<template>
  <ReDialog :close-on-click-modal="true"
    :model-value="modelValue"
    width="560px"
    align-center
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <CardAvatar v-if="skill" :name="skill.name" size="lg" class="detail-header-icon" />
    </template>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <el-icon class="is-loading" size="30">
        <Loading />
      </el-icon>
    </div>
    <div v-else-if="error" class="py-10 text-center text-sm" style="color: var(--el-color-danger)">
      {{ error }}
    </div>
    <div v-else-if="skill" class="detail-body">
      <div class="detail-title">{{ skill.name }}</div>
      <div class="detail-desc">{{ skill.description || '（无描述）' }}</div>

      <div class="detail-content-card">
        <div class="markdown-doc prose dark:prose-invert max-w-none" v-html="rendered"></div>
        <div v-if="truncated" class="detail-truncated">
          完整内容较长，仅展示前 8000 字符
        </div>
      </div>
    </div>

    <template #footer>
      <el-button v-if="skill?.installed" type="success" disabled>已安装</el-button>
      <el-button v-else type="primary" :loading="installing" @click="skill && emit('install', skill)">
        添加
      </el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import ReDialog from '@repo/ui/re-dialog';
import CardAvatar from '@/components/ui/CardAvatar.vue';
import { apiService } from '@/services/ApiService';
import { skillsApi } from '@/services/javaApi';
import { useMarkdown } from '@/composables/useMarkdown';

/** 详情目标：市场页与管理页各自把技能归一化成此结构 */
interface SkillDetailTarget {
  id: string;
  name: string;
  description?: string;
  installed: boolean;
  /** 直链 ZIP（公共市场，按 ZIP 提取） */
  zipUrl?: string;
  /** GitHub 仓库地址 + 子目录（管理页市场结果，按 raw SKILL.md 拉取） */
  repoUrl?: string;
  subdir?: string;
}

const props = defineProps<{
  modelValue: boolean;
  skill: SkillDetailTarget | null;
  installing?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'install', skill: SkillDetailTarget): void;
}>();

const { parseMarkdown } = useMarkdown();
const MAX_CHARS = 8000;

const loading = ref(false);
const error = ref('');
const content = ref('');
const truncated = ref(false);
const rendered = computed(() => parseMarkdown(content.value));

/** 去掉 SKILL.md 顶部 YAML frontmatter，只留正文 */
function stripFrontmatter(text: string): string {
  const src = text.replace(/^﻿/, '');
  if (!src.startsWith('---')) return src;
  const end = src.indexOf('\n---', 3);
  if (end === -1) return src;
  let after = end + 4;
  const nl = src.indexOf('\n', after);
  if (nl !== -1) after = nl + 1;
  return src.slice(after);
}

/** 载入正文：已安装读本地 SKILL.md；未安装下载 ZIP 预览（不落盘） */
async function load() {
  if (!props.skill) return;
  loading.value = true;
  error.value = '';
  content.value = '';
  truncated.value = false;
  try {
    let raw = '';
    if (props.skill.repoUrl) {
      // 市场条目（无论是否已安装）：优先远程预览源 SKILL.md（不落盘）
      const resp = await skillsApi.marketContent({
        url: props.skill.repoUrl,
        path: props.skill.subdir,
      });
      const payload = resp?.data ?? resp;
      if (!payload?.available) {
        error.value = '该技能暂无可预览内容（源未返回 SKILL.md）';
        return;
      }
      raw = payload.content || '';
    } else if (props.skill.installed) {
      // 本地已安装列表打开：按本地技能名读取 SKILL.md
      const resp = await apiService.fetchSkillDocumentation(props.skill.id);
      raw = resp.content || '';
    } else {
      if (!props.skill.zipUrl) {
        error.value = '该技能未提供可预览的 ZIP 包';
        return;
      }
      const preview = await apiService.previewMarketSkill(props.skill.zipUrl);
      raw = preview.content || '';
    }
    const text = stripFrontmatter(raw).trim();
    if (text.length > MAX_CHARS) {
      content.value = text.slice(0, MAX_CHARS);
      truncated.value = true;
    } else {
      content.value = text;
    }
  } catch (e: any) {
    console.error('加载技能详情失败:', e);
    error.value = e?.message || '加载 SKILL.md 失败';
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.modelValue, props.skill?.id],
  ([v]) => {
    if (v) void load();
  },
);
</script>

<style scoped>
.detail-header-icon {
  display: inline-flex;
}
.detail-body {
  display: flex;
  flex-direction: column;
}
.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.detail-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.detail-content-card {
  margin-top: 14px;
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  border-radius: var(--size-surface-radius, 10px);
  padding: 14px 16px;
  background: var(--color-surface, var(--el-fill-color-blank));
  max-height: 46vh;
  overflow-y: auto;
}
.detail-content-card .markdown-doc {
  font-size: 13.5px;
  line-height: 1.65;
}
.detail-truncated {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
</style>
