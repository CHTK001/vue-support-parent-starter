<template>
  <div class="message-actions flex gap-0 text-sm w-full mt-3 text-gray-500 items-center"
    :class="[isAssistant ? 'justify-start -translate-x-1' : 'justify-end translate-x-1']">

    <LTooltip :content="t('chat.messageActions.copy')" placement="top">
      <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.copy')" @click="$emit('copy')">
        <el-icon :size="16">
          <Copy16Regular />
        </el-icon>
      </div>
    </LTooltip>

    <template v-if="!isAssistant && allowGenerate">
      <LTooltip :content="t('chat.messageActions.regenerate')" placement="top">
        <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.regenerate')" @click="$emit('generate')">
          <el-icon :size="16">
            <ArrowClockwise16Regular />
          </el-icon>
        </div>
      </LTooltip>
    </template>

    <template v-if="isAssistant && isLast">
      <LTooltip :content="t('chat.messageActions.regenerate')" placement="top">
        <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.regenerate')" @click="$emit('regenerate')">
          <el-icon :size="16">
            <ArrowClockwise16Regular />
          </el-icon>
        </div>
      </LTooltip>
    </template>

    <!-- 从此处回退：删除本轮及之后的全部消息（破坏性，需上层确认） -->
    <template v-if="isAssistant">
      <LTooltip :content="t('chat.messageActions.rewindHere')" placement="top">
        <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.rewindHere')" @click="$emit('rewind')">
          <el-icon :size="16">
            <ArrowUndo16Regular />
          </el-icon>
        </div>
      </LTooltip>

      </template>

    <!-- 从此处分叉：**只挂在用户消息上**。
         分叉点是「复制到哪一条为止」，语义上属于提问而不是回答。
         挂到助手消息上还会直接踩后端的坑：流式产出的助手消息 id 是前端 UUID，
         而 POST /v2/sessions/{id}/fork 用 parseLongOrNull 解析分叉点，
         UUID 解析为 null → 后端回「缺少分叉点消息 id」→ 前端弹「分叉失败」。
         用户消息来自数据库、id 是数字主键，不会命中这个问题。 -->
    <LTooltip v-if="!isAssistant" :content="t('chat.messageActions.forkHere')" placement="top">
      <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.forkHere')" @click="$emit('fork')">
        <el-icon :size="16">
          <BranchFork16Regular />
        </el-icon>
      </div>
    </LTooltip>

    <!-- 「更多」（编辑内容/删除消息）只对**用户消息**出现：
         助手回复上出现这两项会让用户以为能改/删 AI 的内容（报障 2.4），故整块按 role 收敛 -->
    <LTooltip v-if="!isAssistant" :content="t('chat.messageActions.more')" placement="top">
      <DropdownMenu @command="handleCommand">
        <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.more')">
          <el-icon :size="16" class="pointer-events-none">
            <MoreHorizontal16Regular />
          </el-icon>
        </div>
      <template #dropdown>
        <DropdownMenuItem command="edit" role="menuitem" :aria-label="t('chat.messageActions.editContent')">
          <el-icon class="mr-2">
            <Edit16Regular />
          </el-icon>
          {{ t('chat.messageActions.editContent') }}
        </DropdownMenuItem>
        <DropdownMenuItem command="delete" role="menuitem" :aria-label="t('chat.messageActions.deleteMessage')">
          <el-icon class="mr-2">
            <Delete16Regular />
          </el-icon>
          {{ t('chat.messageActions.deleteMessage') }}
        </DropdownMenuItem>
      </template>
    </DropdownMenu>
    </LTooltip>
    <template v-if="isAssistant">
      <div class="flex text-gray-500 shrink-0 items-center justify-center ml-2">
        <AccessTimeTwotone class="w-3 h-3 mr-1" />
        <span class="text-xs" :title="props.timeFull">{{ props.timeFriendly }}</span>
        <template v-if="props.durationText">
          <span class="text-gray-300 dark:text-gray-600 mx-1">·</span>
          <span class="text-xs">{{ props.durationText }}</span>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ElIcon } from 'element-plus';
import { useI18n } from 'vue-i18n';
import DropdownMenu from '../../ui/DropdownMenu.vue';
import DropdownMenuItem from '../../ui/DropdownMenuItem.vue';
import LTooltip from '../../ui/LTooltip.vue';

const { t } = useI18n();
import {
  Copy16Regular,
  ArrowClockwise16Regular,
  MoreHorizontal16Regular,
  Delete16Regular,
  Edit16Regular,
  ArrowUndo16Regular,
  BranchFork16Regular,
} from '@vicons/fluent';
import { ArrowDownwardTwotone, AccessTimeTwotone } from '@vicons/material';

const props = defineProps<{
  isAssistant: boolean;
  isLast: boolean;
  allowGenerate: boolean;
  timeFull: string;
  timeFriendly: string;
  durationText?: string | null;
}>();

const emit = defineEmits<{
  (e: 'copy'): void;
  (e: 'generate'): void;
  (e: 'regenerate'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'rewind'): void;
  (e: 'fork'): void;
}>();

const handleCommand = (command: string) => {
  if (command === 'edit') {
    emit('edit');
  } else if (command === 'delete') {
    emit('delete');
  }
};
</script>

<style scoped>
@reference "tailwindcss";

.message-action-button {
  @apply cursor-pointer flex items-center gap-1 py-1 px-1 rounded-md mr-1 hover:bg-(--color-surface-hover) disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:hover:text-gray-400 transition-transform duration-100;
}
</style>
