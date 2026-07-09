<template>
  <div class="back-btn-wrap">
    <el-tooltip :content="label || t('common.back')" placement="bottom">
      <el-button text :icon="ArrowLeft" size="small" class="back-btn" @click="goBack" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const props = defineProps<{ to?: string; label?: string }>();

function goBack() {
  if (props.to) router.push(props.to);
  else router.back();
}
</script>

<style scoped>
.back-btn-wrap {
  margin-bottom: 8px;
}
.back-btn {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.back-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color);
}
</style>
