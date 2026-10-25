<script setup lang="ts">
/**
 * ReFilePicker「预览」弹窗 —— 默认把宿主给的预览地址放进 iframe。
 *
 * <p>地址由宿主提供（如 FileStorageServerFilter 的 {@code ?preview=true} 票据通道）；
 * 宿主也可以直接用 `#preview` 插槽接管内容（例如换成带完整渲染器的预览面板），
 * 插槽存在时 iframe 只是兜底。</p>
 */
import { computed } from "vue";
import { TopRight, WarningFilled } from "@element-plus/icons-vue";
import ReDialog from "../../ReDialog/index";
import type { FilePickerItem } from "../types";

const props = defineProps<{
  /** 是否显示（v-model） */
  modelValue: boolean;
  /** 被预览的条目 */
  item?: FilePickerItem | null;
  /** 预览地址（iframe 通道） */
  src?: string;
  /** 地址解析中 / 加载中 */
  loading?: boolean;
  /** 地址解析失败的原因 */
  error?: string;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const title = computed(() => (props.item ? `预览 · ${props.item.name}` : "预览"));
</script>

<template>
  <ReDialog
    v-if="modelValue"
    v-model="visible"
    :title="title"
    width="min(1080px, 94vw)"
    top="6vh"
    append-to-body
    destroy-on-close
    class="rfp-preview"
  >
    <div class="rfp-preview__body">
      <!-- 宿主接管：拿到条目与已解析的地址，自行渲染（如复用文件服务器的预览面板） -->
      <slot
        :item="item"
        :src="src"
        :error="error"
        :loading="loading"
        :close="() => (visible = false)"
      >
        <div v-if="loading" class="rfp-preview__state">预览地址解析中…</div>
        <div v-else-if="error" class="rfp-preview__state is-error">
          <el-icon :size="20"><WarningFilled /></el-icon>
          <span>{{ error }}</span>
        </div>
        <iframe
          v-else-if="src"
          class="rfp-preview__frame"
          :src="src"
          :title="title"
          referrerpolicy="no-referrer"
        />
        <div v-else class="rfp-preview__state">该文件没有可用的预览通道</div>
      </slot>
    </div>

    <template #footer>
      <div class="rfp-preview__foot">
        <a v-if="src" class="rfp-preview__open" :href="src" target="_blank" rel="noopener noreferrer">
          在新窗口打开
          <el-icon :size="12"><TopRight /></el-icon>
        </a>
      </div>
    </template>
  </ReDialog>
</template>

<style scoped>
.rfp-preview__body {
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.rfp-preview__frame {
  width: 100%;
  height: min(72vh, 720px);
  border: 1px solid var(--el-border-color-lighter, #e4e4e7);
  background: #fff;
}

.rfp-preview__state {
  flex: 1;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  text-align: center;
}

.rfp-preview__state.is-error {
  color: var(--el-color-danger);
  flex-direction: column;
}

.rfp-preview__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rfp-preview__open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-primary);
  font-size: 13px;
  text-decoration: none;
}

.rfp-preview__open:hover {
  text-decoration: underline;
}
</style>
