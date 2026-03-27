<template>
  <el-dialog
    :model-value="modelValue"
    width="960px"
    top="6vh"
    destroy-on-close
    append-to-body
    class="job-page-guide-dialog"
    @close="$emit('update:modelValue', false)"
  >
    <template #header>
      <div v-if="guide" class="guide-dialog__header">
        <div class="guide-dialog__header-icon">
          <el-icon><QuestionFilled /></el-icon>
        </div>
        <div class="guide-dialog__header-copy">
          <h3>{{ guide.title }}</h3>
          <p>{{ guide.summary }}</p>
        </div>
      </div>
    </template>

    <div v-if="guide" class="guide-dialog">
      <div class="guide-dialog__tips">
        <el-tag
          v-for="tip in guide.quickTips"
          :key="tip"
          effect="plain"
          type="primary"
          round
        >
          {{ tip }}
        </el-tag>
      </div>

      <section
        v-for="section in guide.sections"
        :key="section.key"
        class="guide-dialog__section"
      >
        <div class="guide-dialog__section-copy">
          <span class="guide-dialog__section-label">{{ section.title }}</span>
          <p class="guide-dialog__section-description">
            {{ section.description }}
          </p>
          <ul class="guide-dialog__bullets">
            <li v-for="bullet in section.bullets" :key="bullet">
              {{ bullet }}
            </li>
          </ul>
          <div v-if="section.example" class="guide-dialog__example">
            {{ section.example }}
          </div>
        </div>

        <div
          v-if="section.media?.length"
          class="guide-dialog__media-grid"
        >
          <article
            v-for="media in section.media"
            :key="media.src"
            class="guide-dialog__media-card"
          >
            <img :src="media.src" :alt="media.title" />
            <div class="guide-dialog__media-copy">
              <strong>{{ media.title }}</strong>
              <span>{{ media.caption }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { QuestionFilled } from "@element-plus/icons-vue";
import type { JobPageGuideDefinition } from "../support/jobPageGuides";

defineProps<{
  modelValue: boolean;
  guide: JobPageGuideDefinition | null;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<style scoped lang="scss">
.guide-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-dialog__header {
  display: flex;
  gap: 14px;
  align-items: center;
  padding-right: 40px;
}

.guide-dialog__header-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 22px;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.guide-dialog__header-copy {
  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }
}

.guide-dialog__tips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.guide-dialog__section {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 18px;
  padding: 20px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.guide-dialog__section-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-dialog__section-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.guide-dialog__section-description {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.guide-dialog__bullets {
  margin: 0;
  padding-left: 18px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.guide-dialog__example {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 13px;
  line-height: 1.6;
}

.guide-dialog__media-grid {
  display: grid;
  gap: 14px;
}

.guide-dialog__media-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);

  img {
    width: 100%;
    display: block;
    border-radius: 12px;
    object-fit: cover;
  }
}

.guide-dialog__media-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 12px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }
}

@media (max-width: 900px) {
  .guide-dialog__section {
    grid-template-columns: 1fr;
  }
}
</style>
