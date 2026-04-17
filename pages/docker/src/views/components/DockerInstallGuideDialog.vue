<template>
  <el-dialog
    v-model="visibleProxy"
    title="首次安装说明"
    width="760px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="guide-wrapper">
      <div class="guide-summary">
        <h3>{{ guide?.title || "Docker 安装引导" }}</h3>
        <p>{{ guide?.summary || "请先阅读步骤说明，再执行安装。" }}</p>
      </div>

      <div v-if="guide?.steps?.length" class="guide-steps">
        <div v-for="step in guide.steps" :key="step.order" class="guide-step">
          <div class="step-index">{{ step.order }}</div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-purpose">{{ step.purpose }}</div>
            <ul class="step-checklist">
              <li v-for="item in step.checklist" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="guide?.notices?.length" class="guide-notice">
        <div class="notice-title">注意事项</div>
        <ul>
          <li v-for="item in guide.notices" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <el-button @click="visibleProxy = false">我知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getDockerInstallGuide } from "../../api";
import type { DockerInstallGuideView } from "../../types";

/**
 * 安装说明弹框：
 * 1) 面向首次使用用户；
 * 2) 文案来自后端统一接口，避免多端不一致。
 */
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [boolean];
}>();

const visibleProxy = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value),
});

const loading = ref(false);
const guide = ref<DockerInstallGuideView | null>(null);

const loadGuide = async () => {
  loading.value = true;
  try {
    const result = await getDockerInstallGuide();
    guide.value = result.data;
  } finally {
    loading.value = false;
  }
};

watch(
  () => visibleProxy.value,
  value => {
    if (value) {
      void loadGuide();
    }
  },
);
</script>

<style scoped lang="scss">
.guide-wrapper {
  max-height: 65vh;
  overflow: auto;
}

.guide-summary {
  margin-bottom: 16px;

  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.guide-step {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
}

.step-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.step-purpose {
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.step-checklist {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guide-notice {
  margin-top: 16px;
  border-top: 1px dashed var(--el-border-color);
  padding-top: 12px;

  .notice-title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }
}
</style>

