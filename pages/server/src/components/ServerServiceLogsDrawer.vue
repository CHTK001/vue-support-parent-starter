<template>
  <ScDrawer
    v-model="visible"
    size="760px"
    destroy-on-close
    :title="service ? `${service.serviceName} · 启动日志` : '服务日志'"
  >
    <div v-loading="loading" class="server-service-log-drawer">
      <header class="server-service-log-drawer__hero">
        <div>
          <p class="server-service-log-drawer__eyebrow">Service Records</p>
          <h3>把最近一次动作、AI 原因和原始输出并排收进同一条记录</h3>
          <p class="server-service-log-drawer__hint">
            重点先看结果和原因，原始日志作为第二阅读层，减少通篇滚动扫日志的成本。
          </p>
        </div>
        <div class="server-chip-group">
          <el-tag class="server-inline-tag" effect="plain" round size="small">
            {{ service?.serviceType || "SERVER_SERVICE" }}
          </el-tag>
          <el-tag class="server-inline-tag" effect="plain" round size="small">
            {{ service?.installPath || "未配置安装目录" }}
          </el-tag>
        </div>
      </header>

      <div class="server-service-log-drawer__toolbar">
        <el-button v-if="service?.serverServiceId" plain @click="$emit('refresh')">
          <IconifyIconOnline icon="ri:refresh-line" />
          <span>刷新日志</span>
        </el-button>
      </div>

      <div v-if="cards.length" class="server-service-log-drawer__list thin-scroller">
        <article
          v-for="card in cards"
          :key="card.item.serverServiceOperationLogId"
          class="server-service-log-drawer__item"
        >
          <header>
            <div>
              <strong>{{ card.title }}</strong>
              <p>{{ card.createTime }}</p>
            </div>
            <el-tag
              class="server-inline-tag"
              :type="card.success ? 'success' : 'danger'"
              effect="plain"
              round
              size="small"
            >
              {{ card.success ? "成功" : "失败" }}
            </el-tag>
          </header>
          <p class="server-service-log-drawer__message">{{ card.message }}</p>
          <div
            v-if="card.aiReason || card.aiSolution"
            class="server-service-log-drawer__ai"
          >
            <p><span>原因</span>{{ card.aiReason || "-" }}</p>
            <p><span>方案</span>{{ card.aiSolution || "-" }}</p>
            <p v-if="card.knowledgeId"><span>知识库</span>#{{ card.knowledgeId }}</p>
            <p v-if="card.expireAt"><span>保留到</span>{{ card.expireAt }}</p>
          </div>
          <ScCodeEditor
            :model-value="card.output"
            :read-only="true"
            height="180px"
            mode="shell"
          />
        </article>
      </div>
      <el-empty v-else description="当前服务还没有操作日志" />
    </div>
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import type { ServerService } from "../api";
import type { ServerServiceLogCard } from "./server-types";

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  service: ServerService | null;
  cards: ServerServiceLogCard[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "refresh"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});
</script>

<style scoped lang="scss">
.server-service-log-drawer {
  display: grid;
  gap: 14px;
}

.server-service-log-drawer__hero {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.server-service-log-drawer__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.server-service-log-drawer__hero h3 {
  margin: 0;
  color: #0f172a;
}

.server-service-log-drawer__hint,
.server-service-log-drawer__item p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.server-service-log-drawer__toolbar {
  display: flex;
  justify-content: flex-end;
}

.server-service-log-drawer__list {
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 270px);
  overflow: auto;
}

.server-service-log-drawer__item {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 22%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.server-service-log-drawer__item header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.server-service-log-drawer__item strong {
  color: #0f172a;
}

.server-service-log-drawer__message {
  margin: 0;
}

.server-service-log-drawer__ai {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background:
    linear-gradient(180deg, rgba(239, 246, 255, 0.96), rgba(248, 250, 252, 0.92));
}

.server-service-log-drawer__ai p {
  display: grid;
  gap: 4px;
  margin: 0;
}

.server-service-log-drawer__ai span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.server-chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.server-inline-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
  font-weight: 500;
}
</style>
