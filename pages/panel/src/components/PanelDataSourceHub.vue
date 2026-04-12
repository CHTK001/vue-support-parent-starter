<template>
  <section class="hub-shell">
    <header class="hub-hero">
      <ElCard class="hero-copy" shadow="never">
        <div class="hero-copy__inner">
          <div class="hero-copy__heading">
            <div>
              <p class="eyebrow">Data Source Studio</p>
              <h1>数据源管理控制台</h1>
            </div>
            <ElTag effect="dark" round type="success">Element Plus Workbench</ElTag>
          </div>

          <p class="summary">
            首页承担数据源管理中枢的职责，连接信息、收藏、入口分发都在这里完成。
            点击任一数据源后，进入独立工作台，像专业数据库客户端一样完成浏览、结构分析和 SQL 操作。
          </p>

          <div class="hero-ribbon">
            <span>Workspace Ticket</span>
            <span>Explorer</span>
            <span>SQL / Doc / AI</span>
          </div>

          <div class="hero-insights">
            <article class="hero-note">
              <small>Primary Entry</small>
              <strong>数据源管理是主入口</strong>
              <p>连接配置、收藏分发和工作台启动全部收口到首页，不再分散在多个列表页。</p>
            </article>
            <article class="hero-note">
              <small>Client Flow</small>
              <strong>工作台承接后续全链路操作</strong>
              <p>进入新页面后保持对象浏览、SQL 调试、结构文档和 AI 解释的连续上下文。</p>
            </article>
          </div>

          <div class="hero-stats">
            <article class="stat-card">
              <small>Sources</small>
              <strong>{{ sourceList.length }}</strong>
              <span>已录入数据源</span>
            </article>
            <article class="stat-card">
              <small>Connections</small>
              <strong>{{ cachedCount }}</strong>
              <span>当前活跃连接</span>
            </article>
            <article class="stat-card">
              <small>Favorites</small>
              <strong>{{ favoriteCount }}</strong>
              <span>常用入口收藏</span>
            </article>
          </div>
        </div>
      </ElCard>

      <ElCard class="hero-panel" shadow="never">
        <div class="panel-head panel-head--body">
          <div>
            <p>Connection Designer</p>
            <h2>连接配置</h2>
          </div>
          <ElButton plain round @click="$emit('reset-form')">重置</ElButton>
        </div>

        <div class="form-grid">
          <label class="field">
            <span>数据源类型</span>
            <ElSelect
              :model-value="modelValue.sourceType"
              placeholder="选择数据源类型"
              @update:model-value="updateField('sourceType', $event)"
            >
              <ElOption
                v-for="option in sourceTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>

          <label class="field">
            <span>名称</span>
            <ElInput
              :model-value="modelValue.connectionName"
              placeholder="例如：生产 MySQL / 财务库"
              @update:model-value="updateField('connectionName', $event)"
            />
          </label>

          <label class="field">
            <span>主机</span>
            <ElInput
              :model-value="modelValue.host"
              placeholder="127.0.0.1"
              @update:model-value="updateField('host', $event)"
            />
          </label>

          <label class="field">
            <span>端口</span>
            <ElInputNumber
              :controls="false"
              :min="0"
              :model-value="modelValue.port"
              @update:model-value="updateNumberField('port', $event)"
            />
          </label>

          <label class="field">
            <span>{{ databaseLabel }}</span>
            <ElInput
              :model-value="modelValue.databaseName"
              :placeholder="databasePlaceholder"
              @update:model-value="updateField('databaseName', $event)"
            />
          </label>

          <label class="field field--full">
            <span>{{ protocolLabel }}</span>
            <ElInput
              :model-value="modelValue.protocol"
              :placeholder="protocolPlaceholder"
              @update:model-value="updateField('protocol', $event)"
            />
          </label>

          <label class="field">
            <span>用户名</span>
            <ElInput
              :model-value="modelValue.username"
              placeholder="root"
              @update:model-value="updateField('username', $event)"
            />
          </label>

          <label class="field">
            <span>密码</span>
            <ElInput
              :model-value="modelValue.password"
              placeholder="请输入连接密码"
              show-password
              type="password"
              @update:model-value="updateField('password', $event)"
            />
          </label>

          <label class="field field--full">
            <span>备注</span>
            <ElInput
              :autosize="{ minRows: 3, maxRows: 5 }"
              :model-value="modelValue.note || ''"
              placeholder="建议记录用途、权限边界、owner 和风险说明。"
              type="textarea"
              @update:model-value="updateField('note', $event)"
            />
          </label>
        </div>

        <div class="panel-actions">
          <ElButton round type="primary" @click="$emit('save-source')">
            保存数据源
          </ElButton>
          <span class="panel-hint">
            工作台只能从已保存的数据源进入，未接入类型先保留配置，不开放启动。
          </span>
        </div>
      </ElCard>
    </header>

    <ElCard class="source-board" shadow="never">
      <div class="board-head board-head--body">
        <div>
          <p>Workspace Launchpad</p>
          <h2>工作区入口</h2>
        </div>
        <div class="board-side">
          <span>双击卡片或点击“打开工作台”，即可跳转独立页面继续操作。</span>
          <div class="board-tags">
            <ElTag effect="plain" round>总计 {{ sourceList.length }}</ElTag>
            <ElTag effect="plain" round type="warning">收藏 {{ favoriteCount }}</ElTag>
          </div>
        </div>
      </div>

      <div v-if="sourceList.length" class="source-grid">
        <ElCard
          v-for="source in sourceList"
          :key="source.sourceId"
          class="source-card"
          shadow="hover"
          @dblclick="$emit('open-source', source)"
        >
          <div class="source-top">
            <div class="source-title">
              <span class="source-badge">{{ sourceInitial(source.connectionName) }}</span>
              <div>
                <p class="source-name">{{ source.connectionName }}</p>
                <p class="source-path">
                  {{ source.host }}:{{ source.port }} / {{ source.databaseName || "-" }}
                </p>
              </div>
            </div>
            <ElButton
              plain
              round
              size="small"
              type="warning"
              @click="$emit('toggle-favorite', source.sourceId)"
            >
              {{ source.favorite ? "已收藏" : "收藏" }}
            </ElButton>
          </div>

          <p class="source-note">
            {{ source.note || "未填写备注，建议补充使用场景、权限范围和 owner。" }}
          </p>

          <div class="source-meta">
            <ElTag effect="plain" round>{{ source.sourceType }}</ElTag>
            <ElTag effect="plain" round type="success">{{ source.username || "-" }}</ElTag>
            <ElTag effect="plain" round type="info">{{ formatTime(source.updatedAt) }}</ElTag>
          </div>

          <div class="source-actions">
            <ElButton
              :disabled="source.sourceType !== 'JDBC'"
              round
              type="primary"
              @click="$emit('open-source', source)"
            >
              打开工作台
            </ElButton>
            <ElButton plain round @click="$emit('edit-source', source)">
              编辑
            </ElButton>
            <ElButton plain round type="danger" @click="$emit('delete-source', source.sourceId)">
              删除
            </ElButton>
          </div>
        </ElCard>
      </div>

      <div v-else class="empty-state">
        <div class="empty-graphic">
          <span />
          <span />
          <span />
        </div>
        <ElEmpty description="先录入一个连接，再把它作为工作台入口保存下来。" />
      </div>
    </ElCard>
  </section>
</template>

<script setup lang="ts">
import {
  ElButton,
  ElCard,
  ElEmpty,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTag,
} from "element-plus";
import { computed } from "vue";
import type { JdbcConnectionForm, PanelSavedSource } from "../panel";

const props = defineProps<{
  cachedCount: number;
  modelValue: JdbcConnectionForm;
  sources: PanelSavedSource[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: "delete-source", sourceId: string): void;
  (e: "edit-source", source: PanelSavedSource): void;
  (e: "open-source", source: PanelSavedSource): void;
  (e: "reset-form"): void;
  (e: "save-source"): void;
  (e: "toggle-favorite", sourceId: string): void;
  (e: "update:modelValue", value: JdbcConnectionForm): void;
}>();

const sourceList = computed(() =>
  Array.isArray(props.sources)
    ? props.sources.filter(
        (source): source is PanelSavedSource =>
          !!source && typeof source === "object",
      )
    : [],
);

const favoriteCount = computed(
  () => sourceList.value.filter(source => source.favorite).length,
);

const formatTime = (value?: string) => (value ? value.replace("T", " ").slice(0, 16) : "未记录时间");

const sourceInitial = (name?: string) => (name || "D").trim().slice(0, 1).toUpperCase();

const sourceTypeOptions = [
  { label: "JDBC / SQL", value: "JDBC" },
  { label: "Redis", value: "REDIS" },
] as const;

const databaseLabel = computed(() =>
  props.modelValue.sourceType === "REDIS" ? "DB Index" : "数据库",
);

const protocolLabel = computed(() =>
  props.modelValue.sourceType === "REDIS" ? "连接地址" : "JDBC URL",
);

const protocolPlaceholder = computed(() =>
  props.modelValue.sourceType === "REDIS"
    ? "redis://127.0.0.1:6379/0"
    : "jdbc:mysql://127.0.0.1:3306/panel_case",
);

const databasePlaceholder = computed(() =>
  props.modelValue.sourceType === "REDIS" ? "0" : "panel_case",
);

const updateField = <K extends keyof JdbcConnectionForm>(
  field: K,
  value: JdbcConnectionForm[K],
) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};

const updateNumberField = <K extends keyof JdbcConnectionForm>(
  field: K,
  value: number | undefined,
) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: Number(value ?? 0),
  });
};
</script>

<style scoped lang="scss">
.hub-shell {
  display: grid;
  gap: 24px;
}

.hub-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(360px, 420px);
  gap: 20px;
  align-items: stretch;
}

.hero-copy,
.hero-panel,
.source-board {
  overflow: hidden;
  border: 1px solid rgba(120, 148, 163, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 250, 0.9));
  box-shadow:
    0 30px 60px rgba(17, 32, 39, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.hero-copy {
  position: relative;
  background:
    radial-gradient(circle at 12% 18%, rgba(12, 159, 126, 0.22), transparent 26%),
    radial-gradient(circle at 88% 14%, rgba(39, 103, 245, 0.18), transparent 26%),
    linear-gradient(135deg, rgba(247, 251, 254, 0.98), rgba(233, 241, 247, 0.95));
}

.hero-copy::after {
  position: absolute;
  inset: auto -48px -48px auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 116, 144, 0.16), transparent 68%);
  content: "";
  pointer-events: none;
}

.hero-copy__inner {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 22px;
}

.hero-copy__heading,
.panel-head,
.board-head,
.source-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.eyebrow,
.panel-head p,
.board-head p {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #37718a;
}

.hero-copy h1,
.panel-head h2,
.board-head h2 {
  margin: 0;
  font-family: "Avenir Next", "Segoe UI", "PingFang SC", sans-serif;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #122532;
}

.hero-copy h1 {
  max-width: 520px;
  font-size: clamp(34px, 4vw, 58px);
  line-height: 1.02;
}

.summary {
  max-width: 720px;
  margin: 0;
  color: #547082;
  font-size: 16px;
  line-height: 1.9;
}

.hero-ribbon {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-ribbon span {
  padding: 9px 14px;
  border: 1px solid rgba(61, 98, 120, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #355567;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-insights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.hero-note {
  display: grid;
  gap: 8px;
  padding: 18px 18px 16px;
  border: 1px solid rgba(97, 132, 154, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(16px);
}

.hero-note small {
  color: #5c7d91;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-note strong {
  color: #122532;
  font-size: 18px;
  font-weight: 700;
}

.hero-note p {
  margin: 0;
  color: #607b8c;
  line-height: 1.75;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px 18px 16px;
  border: 1px solid rgba(97, 132, 154, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
}

.stat-card small {
  display: block;
  color: #638195;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 34px;
  font-weight: 700;
  color: #0f2431;
}

.stat-card span {
  display: block;
  margin-top: 6px;
  color: #6c8393;
  font-size: 13px;
}

.panel-head h2,
.board-head h2 {
  font-size: 28px;
}

.board-head span {
  max-width: 360px;
  color: #658091;
  line-height: 1.75;
  text-align: right;
}

.panel-head--body,
.board-head--body {
  margin-bottom: 22px;
}

.board-side {
  display: grid;
  justify-items: end;
  gap: 10px;
}

.board-tags,
.source-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field--full {
  grid-column: 1 / -1;
}

.field span {
  color: #6a8594;
  font-size: 12px;
  font-weight: 600;
}

.panel-actions,
.source-actions,
.source-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.panel-actions {
  margin-top: 20px;
  align-items: center;
}

.panel-hint {
  color: #6a8594;
  line-height: 1.7;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
}

.source-card {
  overflow: hidden;
  border: 1px solid rgba(102, 130, 148, 0.12);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 249, 251, 0.92));
}

.source-card :deep(.el-card__body) {
  display: grid;
  gap: 16px;
}

.source-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 44px rgba(15, 23, 42, 0.12);
}

.source-name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #102431;
}

.source-badge {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(16, 185, 129, 0.2));
  color: #154066;
  font-size: 18px;
  font-weight: 800;
}

.source-path,
.source-note {
  margin: 0;
  color: #607b8c;
  line-height: 1.75;
}

.source-note {
  min-height: 56px;
}

.empty-state {
  padding: 18px 0 6px;
  display: grid;
  justify-items: center;
}

.empty-graphic {
  position: relative;
  width: 140px;
  height: 96px;
  margin: 0 auto 8px;
}

.empty-graphic span {
  position: absolute;
  display: block;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(33, 101, 235, 0.15), rgba(16, 185, 129, 0.18));
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
}

.empty-graphic span:nth-child(1) {
  top: 18px;
  left: 0;
  width: 72px;
  height: 54px;
}

.empty-graphic span:nth-child(2) {
  top: 0;
  right: 10px;
  width: 88px;
  height: 64px;
}

.empty-graphic span:nth-child(3) {
  right: 0;
  bottom: 0;
  width: 54px;
  height: 42px;
}

.hero-copy :deep(.el-card__body),
.hero-panel :deep(.el-card__body),
.source-board :deep(.el-card__body) {
  padding: 28px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number .el-input__wrapper) {
  border-radius: 16px;
  box-shadow: 0 0 0 1px rgba(109, 137, 154, 0.12) inset;
  background: rgba(255, 255, 255, 0.86);
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px rgba(29, 120, 214, 0.35) inset,
    0 0 0 4px rgba(59, 130, 246, 0.12);
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: #122532;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-button),
:deep(.el-tag) {
  border-radius: 999px;
}

@media (max-width: 1180px) {
  .hub-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-stats,
  .form-grid,
  .hero-insights {
    grid-template-columns: 1fr;
  }

  .hero-copy :deep(.el-card__body),
  .hero-panel :deep(.el-card__body),
  .source-board :deep(.el-card__body) {
    padding: 22px;
  }

  .hero-copy__heading,
  .panel-head,
  .board-head,
  .source-top {
    flex-direction: column;
  }

  .board-head span {
    text-align: left;
  }

  .board-side {
    justify-items: start;
  }
}
</style>
