<template>
  <div class="message-actions flex gap-0 text-sm w-full mt-3 text-gray-500 items-center"
    :class="[isAssistant ? 'justify-start -translate-x-1' : 'justify-end translate-x-1']">

    <!-- 复制：成功后图标变绿色勾 2 秒 -->
    <LTooltip :content="copySuccess ? '已复制!' : t('chat.messageActions.copy')" placement="top">
      <div class="message-action-button" role="button"
        :aria-label="copySuccess ? '已复制' : t('chat.messageActions.copy')"
        :class="{ 'copy-success': copySuccess }"
        @click="handleCopy">
        <el-icon :size="16">
          <Checkmark16Regular v-if="copySuccess" />
          <Copy16Regular v-else />
        </el-icon>
      </div>
    </LTooltip>

    <!-- 引用 / 回复该消息 -->
    <LTooltip :content="t('chat.messageActions.quote')" placement="top">
      <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.quote')" @click="emit('quote', { messageId: props.messageId || '' })">
        <el-icon :size="16">
          <Chat16Regular />
        </el-icon>
      </div>
    </LTooltip>

    <!-- Reactions: 👍 👎 -->
    <LTooltip :content="t('chat.messageActions.thumbsUp')" placement="top">
      <div class="message-action-button" :class="{ 'reaction-active': reactions?.up }" role="button" :aria-label="t('chat.messageActions.thumbsUp')" @click="emit('reaction', { messageId: props.messageId || '', type: 'up' })">
        <el-icon :size="16"><ThumbLike16Regular /></el-icon>
      </div>
    </LTooltip>
    <LTooltip :content="t('chat.messageActions.thumbsDown')" placement="top">
      <div class="message-action-button" :class="{ 'reaction-active-down': reactions?.down }" role="button" :aria-label="t('chat.messageActions.thumbsDown')" @click="emit('reaction', { messageId: props.messageId || '', type: 'down' })">
        <el-icon :size="16"><ThumbDislike16Regular /></el-icon>
      </div>
    </LTooltip>

    <!-- 查看 Markdown 源码 -->
    <LTooltip :content="t('chat.messageActions.viewSource')" placement="top">
      <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.viewSource')" @click="emit('view-source', { messageId: props.messageId || '', rawContent: props.rawContent || '' })">
        <el-icon :size="16"><Code16Regular /></el-icon>
      </div>
    </LTooltip>

    <!-- 导出为 Markdown -->
    <LTooltip :content="t('chat.messageActions.exportMd')" placement="top">
      <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.exportMd')" @click="emit('export-md', { messageId: props.messageId || '', rawContent: props.rawContent || '' })">
        <el-icon :size="16"><DocumentArrowDown16Regular /></el-icon>
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

    <template v-if="isAssistant">
      <LTooltip :content="t('chat.messageActions.rewindHere')" placement="top">
        <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.rewindHere')" @click="$emit('rewind')">
          <el-icon :size="16">
            <ArrowUndo16Regular />
          </el-icon>
        </div>
      </LTooltip>
    </template>

    <LTooltip v-if="!isAssistant" :content="t('chat.messageActions.forkHere')" placement="top">
      <div class="message-action-button" role="button" :aria-label="t('chat.messageActions.forkHere')" @click="$emit('fork')">
        <el-icon :size="16">
          <BranchFork16Regular />
        </el-icon>
      </div>
    </LTooltip>

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
import { ref } from 'vue';
import { ElIcon } from 'element-plus';
import { useI18n } from 'vue-i18n';
import DropdownMenu from '../../ui/DropdownMenu.vue';
import DropdownMenuItem from '../../ui/DropdownMenuItem.vue';
import LTooltip from '../../ui/LTooltip.vue';
import {
  Copy16Regular,
  ArrowClockwise16Regular,
  MoreHorizontal16Regular,
  Delete16Regular,
  Edit16Regular,
  ArrowUndo16Regular,
  BranchFork16Regular,
  Checkmark16Regular,
  Chat16Regular,
  ThumbLike16Regular,
  ThumbDislike16Regular,
  Code16Regular,
  DocumentArrowDown16Regular,
} from '@vicons/fluent';
import { AccessTimeTwotone } from '@vicons/material';

const props = defineProps<{
  isAssistant: boolean;
  isLast: boolean;
  allowGenerate: boolean;
  timeFull: string;
  timeFriendly: string;
  durationText?: string | null;
  messageId?: string;
  rawContent?: string;
  reactions?: { up?: boolean; down?: boolean };
}>();

const emit = defineEmits<{
  (e: 'copy'): void;
  (e: 'generate'): void;
  (e: 'regenerate'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'rewind'): void;
  (e: 'fork'): void;
  (e: 'quote', payload: { messageId: string; content?: string }): void;
  (e: 'reaction', payload: { messageId: string; type: 'up' | 'down' }): void;
  (e: 'view-source', payload: { messageId: string; rawContent: string }): void;
  (e: 'export-md', payload: { messageId: string; rawContent: string }): void;
}>();

const { t } = useI18n();

// 复制按钮成功反馈状态
const copySuccess = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

function handleCopy() {
  emit('copy');
  copySuccess.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copySuccess.value = false; }, 2000);
}

function handleCommand(command: string) {
  if (command === 'edit') emit('edit');
  else if (command === 'delete') emit('delete');
}
</script>

<style scoped>
.message-action-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px;
  border-radius: 6px;
  margin-right: 4px;
  transition: all 0.2s ease;
  color: var(--el-text-color-placeholder);
}
.message-action-button:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.message-action-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.copy-success {
  color: var(--el-color-success) !important;
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent) !important;
}
.reaction-active {
  color: var(--el-color-primary) !important;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent) !important;
}
.reaction-active-down {
  color: var(--el-color-danger) !important;
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent) !important;
}
</style>
