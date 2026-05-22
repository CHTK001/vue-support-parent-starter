<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="更新容器资源"
    width="500px"
  >
    <ElForm label-width="120px">
      <ElFormItem label="CPU 限制">
        <ElInput v-model="cpuCpus" placeholder="如: 1.5（不填不限）" />
        <div class="cu-hint">限制容器可使用的 CPU 核心数</div>
      </ElFormItem>
      <ElFormItem label="内存限制">
        <ElInput v-model="memoryStr" placeholder="如: 512m 或 1g（不填不限）" />
        <div class="cu-hint">容器最大可用内存</div>
      </ElFormItem>
      <ElFormItem label="重启策略">
        <ElSelect v-model="restartPolicy" placeholder="选择策略">
          <ElOption label="无" value="" />
          <ElOption label="失败时重启 (on-failure)" value="on-failure" />
          <ElOption label="总是重启 (always)" value="always" />
          <ElOption label="除非停止 (unless-stopped)" value="unless-stopped" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="restartPolicy === 'on-failure'" label="最大重试">
        <ElInputNumber v-model="maxRetries" :min="0" style="width:100%" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="updating" @click="handleUpdate">更新</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage, ElOption, ElSelect } from "element-plus";
import * as dockerApi from "../../api/docker";

const props = defineProps<{
  visible: boolean;
  connectionId: string;
  containerId: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

const cpuCpus = ref("");
const memoryStr = ref("");
const restartPolicy = ref("");
const maxRetries = ref(0);
const updating = ref(false);

const parseMemory = (s: string): number | undefined => {
  if (!s) return undefined;
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(k|m|g|b)?$/i);
  if (!m) return undefined;
  const num = parseFloat(m[1]);
  const unit = (m[2] || "b").toLowerCase();
  const multipliers: Record<string, number> = { b: 1, k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
  return Math.round(num * (multipliers[unit] || 1));
};

const handleUpdate = async () => {
  updating.value = true;
  try {
    const memoryBytes = parseMemory(memoryStr.value);
    await dockerApi.updateDockerContainer(props.connectionId, props.containerId, {
      cpuCpus: cpuCpus.value || undefined,
      memoryBytes: memoryBytes,
      restartPolicy: restartPolicy.value || undefined,
      maxRetries: restartPolicy.value === "on-failure" ? maxRetries.value : undefined,
    });
    ElMessage.success("容器资源已更新");
  } catch { ElMessage.error("更新失败"); }
  finally { updating.value = false; }
};
</script>

<style scoped>
.cu-hint { font-size: 11px; color: var(--el-text-color-placeholder); margin-top: 4px; }
</style>
